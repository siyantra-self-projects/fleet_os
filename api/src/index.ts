/**
 * Fleet Management API - Cloudflare Workers + D1
 * Multi-tenant SaaS backend
 */

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  FRONTEND_URL: string;
}

// ============================================
// CORS Configuration
// ============================================

function corsHeaders(origin?: string) {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    origin // Allow the requesting origin (for Vercel deployments)
  ].filter(Boolean);

  return {
    'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonResponse(data: any, status = 200, origin?: string) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin),
    },
  });
}

// ============================================
// Simple JWT Implementation (no external deps)
// ============================================

async function createJWT(payload: any, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }));
  const message = `${encodedHeader}.${encodedPayload}`;
  
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)));
  
  return `${message}.${encodedSignature}`;
}

async function verifyJWT(token: string, secret: string): Promise<any | null> {
  try {
    const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
    const message = `${encodedHeader}.${encodedPayload}`;
    
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const signature = Uint8Array.from(atob(encodedSignature), c => c.charCodeAt(0));
    const isValid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(message));
    
    if (!isValid) return null;
    
    const payload = JSON.parse(atob(encodedPayload));
    if (payload.exp < Date.now()) return null;
    
    return payload;
  } catch {
    return null;
  }
}

// ============================================
// Password Hashing (Simple - Use bcrypt in production)
// ============================================

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// ============================================
// AUTH ENDPOINTS
// ============================================

async function handleRegister(request: Request, env: Env, origin?: string) {
  const body: any = await request.json();
  const { email, password, companyName, currency } = body;

  if (!email || !password || !companyName) {
    return jsonResponse({ error: 'Missing required fields' }, 400, origin);
  }

  // Check if exists
  const existing = await env.DB.prepare('SELECT id FROM user_accounts WHERE email = ?').bind(email).first();
  if (existing) {
    return jsonResponse({ error: 'Email already registered' }, 409, origin);
  }

  const passwordHash = await hashPassword(password);
  const result = await env.DB.prepare(
    `INSERT INTO user_accounts (email, password_hash, company_name, currency, onboarded, role, plan, status)
     VALUES (?, ?, ?, ?, 0, 'user', 'Free', 'Active')`
  ).bind(email, passwordHash, companyName, currency || 'GBP (£)').run();

  const userId = result.meta.last_row_id as number;
  const token = await createJWT({ userId, email, role: 'user' }, env.JWT_SECRET);

  // Create default config
  await env.DB.prepare(
    `INSERT INTO app_config (user_id, week_start, fuel_unit, currency, fuel_threshold, garage_threshold, revenue_target)
     VALUES (?, 'Monday', 'Litres', ?, '100', '500', '50000')`
  ).bind(userId, currency || 'GBP (£)').run();

  return jsonResponse({
    success: true,
    token,
    user: { id: userId, email, companyName, currency: currency || 'GBP (£)', onboarded: false, role: 'user' }
  }, 201, origin);
}

async function handleLogin(request: Request, env: Env, origin?: string) {
  const body: any = await request.json();
  const { email, password } = body;

  const user = await env.DB.prepare(
    'SELECT id, email, password_hash, company_name, currency, onboarded, role, plan, status FROM user_accounts WHERE email = ?'
  ).bind(email).first();

  if (!user || user.status !== 'Active') {
    return jsonResponse({ error: 'Invalid credentials' }, 401, origin);
  }

  const isValid = await verifyPassword(password, user.password_hash as string);
  if (!isValid) {
    return jsonResponse({ error: 'Invalid credentials' }, 401, origin);
  }

  const token = await createJWT({ userId: user.id, email: user.email, role: user.role }, env.JWT_SECRET);

  return jsonResponse({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      companyName: user.company_name,
      currency: user.currency,
      onboarded: user.onboarded === 1,
      role: user.role,
      plan: user.plan
    }
  }, 200, origin);
}

async function handleCompleteOnboarding(request: Request, env: Env, user: any, origin?: string) {
  const body: any = await request.json();
  const { companyName, currency, driver, vehicle } = body;

  // Update user
  await env.DB.prepare(
    'UPDATE user_accounts SET company_name = ?, currency = ?, onboarded = 1 WHERE id = ?'
  ).bind(companyName, currency, user.userId).run();

  // Add driver
  await env.DB.prepare(
    'INSERT INTO drivers (id, user_id, name, phone, license, status) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(driver.id, user.userId, driver.name, driver.phone, driver.license, 'Active').run();

  // Add vehicle
  await env.DB.prepare(
    'INSERT INTO vehicles (id, user_id, reg, name, type, status) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(vehicle.id, user.userId, vehicle.reg, vehicle.name, vehicle.type, 'Active').run();

  // Update config
  await env.DB.prepare(
    'UPDATE app_config SET currency = ? WHERE user_id = ?'
  ).bind(currency, user.userId).run();

  return jsonResponse({ success: true }, 200, origin);
}

// ============================================
// DRIVER ENDPOINTS
// ============================================

async function handleGetDrivers(env: Env, user: any, origin?: string) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM drivers WHERE user_id = ? ORDER BY name'
  ).bind(user.userId).all();
  return jsonResponse({ success: true, data: results }, 200, origin);
}

async function handleCreateDriver(request: Request, env: Env, user: any, origin?: string) {
  const body: any = await request.json();
  await env.DB.prepare(
    'INSERT INTO drivers (id, user_id, name, phone, license, status) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(body.id, user.userId, body.name, body.phone, body.license, body.status || 'Active').run();
  return jsonResponse({ success: true, id: body.id }, 201, origin);
}

async function handleUpdateDriver(request: Request, env: Env, user: any, driverId: string, origin?: string) {
  const body: any = await request.json();
  await env.DB.prepare(
    'UPDATE drivers SET name = ?, phone = ?, license = ?, status = ? WHERE id = ? AND user_id = ?'
  ).bind(body.name, body.phone, body.license, body.status, driverId, user.userId).run();
  return jsonResponse({ success: true }, 200, origin);
}

async function handleDeleteDriver(env: Env, user: any, driverId: string, origin?: string) {
  await env.DB.prepare('DELETE FROM drivers WHERE id = ? AND user_id = ?').bind(driverId, user.userId).run();
  return jsonResponse({ success: true }, 200, origin);
}

// ============================================
// VEHICLE ENDPOINTS
// ============================================

async function handleGetVehicles(env: Env, user: any, origin?: string) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM vehicles WHERE user_id = ? ORDER BY name'
  ).bind(user.userId).all();
  return jsonResponse({ success: true, data: results }, 200, origin);
}

async function handleCreateVehicle(request: Request, env: Env, user: any, origin?: string) {
  const body: any = await request.json();
  await env.DB.prepare(
    'INSERT INTO vehicles (id, user_id, reg, name, type, status) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(body.id, user.userId, body.reg, body.name, body.type, body.status || 'Active').run();
  return jsonResponse({ success: true, id: body.id }, 201, origin);
}

async function handleUpdateVehicle(request: Request, env: Env, user: any, vehicleId: string, origin?: string) {
  const body: any = await request.json();
  await env.DB.prepare(
    'UPDATE vehicles SET reg = ?, name = ?, type = ?, status = ? WHERE id = ? AND user_id = ?'
  ).bind(body.reg, body.name, body.type, body.status, vehicleId, user.userId).run();
  return jsonResponse({ success: true }, 200, origin);
}

async function handleDeleteVehicle(env: Env, user: any, vehicleId: string, origin?: string) {
  await env.DB.prepare('DELETE FROM vehicles WHERE id = ? AND user_id = ?').bind(vehicleId, user.userId).run();
  return jsonResponse({ success: true }, 200, origin);
}

// ============================================
// ROUTE ENDPOINTS
// ============================================

async function handleGetRoutes(env: Env, user: any, origin?: string) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM routes WHERE user_id = ? ORDER BY name'
  ).bind(user.userId).all();
  return jsonResponse({ success: true, data: results }, 200, origin);
}

async function handleCreateRoute(request: Request, env: Env, user: any, origin?: string) {
  const body: any = await request.json();
  await env.DB.prepare(
    'INSERT INTO routes (id, user_id, name) VALUES (?, ?, ?)'
  ).bind(body.id, user.userId, body.name).run();
  return jsonResponse({ success: true, id: body.id }, 201, origin);
}

async function handleUpdateRoute(request: Request, env: Env, user: any, routeId: string, origin?: string) {
  const body: any = await request.json();
  await env.DB.prepare(
    'UPDATE routes SET name = ? WHERE id = ? AND user_id = ?'
  ).bind(body.name, routeId, user.userId).run();
  return jsonResponse({ success: true }, 200, origin);
}

async function handleDeleteRoute(env: Env, user: any, routeId: string, origin?: string) {
  await env.DB.prepare('DELETE FROM routes WHERE id = ? AND user_id = ?').bind(routeId, user.userId).run();
  return jsonResponse({ success: true }, 200, origin);
}

// ============================================
// ORDER ENDPOINTS
// ============================================

async function handleGetOrders(env: Env, user: any, origin?: string) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM orders WHERE user_id = ? ORDER BY date DESC'
  ).bind(user.userId).all();
  return jsonResponse({ success: true, data: results }, 200, origin);
}

async function handleCreateOrder(request: Request, env: Env, user: any, origin?: string) {
  const body: any = await request.json();
  await env.DB.prepare(
    'INSERT INTO orders (id, user_id, date, driver_id, vehicle_id, route_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(body.id, user.userId, body.date, body.driverId, body.vehicleId, body.routeId, body.status || 'Assigned').run();
  return jsonResponse({ success: true, id: body.id }, 201, origin);
}

async function handleUpdateOrder(request: Request, env: Env, user: any, orderId: string, origin?: string) {
  const body: any = await request.json();
  await env.DB.prepare(
    'UPDATE orders SET date = ?, driver_id = ?, vehicle_id = ?, route_id = ?, status = ? WHERE id = ? AND user_id = ?'
  ).bind(body.date, body.driverId, body.vehicleId, body.routeId, body.status, orderId, user.userId).run();
  return jsonResponse({ success: true }, 200, origin);
}

async function handleDeleteOrder(env: Env, user: any, orderId: string, origin?: string) {
  await env.DB.prepare('DELETE FROM orders WHERE id = ? AND user_id = ?').bind(orderId, user.userId).run();
  return jsonResponse({ success: true }, 200, origin);
}

// Similar patterns for Fuel, Garage, Payroll, Settlements...
// (Abbreviated for brevity - follow same pattern)

// ============================================
// MAIN ROUTER
// ============================================

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(origin) });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Public routes
      if (path === '/api/auth/register' && request.method === 'POST') {
        return await handleRegister(request, env, origin);
      }
      if (path === '/api/auth/login' && request.method === 'POST') {
        return await handleLogin(request, env, origin);
      }

      // Protected routes
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return jsonResponse({ error: 'Unauthorized' }, 401, origin);
      }

      const token = authHeader.substring(7);
      const user = await verifyJWT(token, env.JWT_SECRET);
      if (!user) {
        return jsonResponse({ error: 'Invalid token' }, 401, origin);
      }

      // Onboarding
      if (path === '/api/auth/onboarding' && request.method === 'POST') {
        return await handleCompleteOnboarding(request, env, user, origin);
      }

      // Drivers
      if (path === '/api/drivers' && request.method === 'GET') return await handleGetDrivers(env, user, origin);
      if (path === '/api/drivers' && request.method === 'POST') return await handleCreateDriver(request, env, user, origin);
      if (path.match(/^\/api\/drivers\/[^\/]+$/) && request.method === 'PUT') {
        return await handleUpdateDriver(request, env, user, path.split('/')[3], origin);
      }
      if (path.match(/^\/api\/drivers\/[^\/]+$/) && request.method === 'DELETE') {
        return await handleDeleteDriver(env, user, path.split('/')[3], origin);
      }

      // Vehicles
      if (path === '/api/vehicles' && request.method === 'GET') return await handleGetVehicles(env, user, origin);
      if (path === '/api/vehicles' && request.method === 'POST') return await handleCreateVehicle(request, env, user, origin);
      if (path.match(/^\/api\/vehicles\/[^\/]+$/) && request.method === 'PUT') {
        return await handleUpdateVehicle(request, env, user, path.split('/')[3], origin);
      }
      if (path.match(/^\/api\/vehicles\/[^\/]+$/) && request.method === 'DELETE') {
        return await handleDeleteVehicle(env, user, path.split('/')[3], origin);
      }

      // Routes
      if (path === '/api/routes' && request.method === 'GET') return await handleGetRoutes(env, user, origin);
      if (path === '/api/routes' && request.method === 'POST') return await handleCreateRoute(request, env, user, origin);
      if (path.match(/^\/api\/routes\/[^\/]+$/) && request.method === 'PUT') {
        return await handleUpdateRoute(request, env, user, path.split('/')[3], origin);
      }
      if (path.match(/^\/api\/routes\/[^\/]+$/) && request.method === 'DELETE') {
        return await handleDeleteRoute(env, user, path.split('/')[3], origin);
      }

      // Orders
      if (path === '/api/orders' && request.method === 'GET') return await handleGetOrders(env, user, origin);
      if (path === '/api/orders' && request.method === 'POST') return await handleCreateOrder(request, env, user, origin);
      if (path.match(/^\/api\/orders\/[^\/]+$/) && request.method === 'PUT') {
        return await handleUpdateOrder(request, env, user, path.split('/')[3], origin);
      }
      if (path.match(/^\/api\/orders\/[^\/]+$/) && request.method === 'DELETE') {
        return await handleDeleteOrder(env, user, path.split('/')[3], origin);
      }

      return jsonResponse({ error: 'Not Found' }, 404, origin);

    } catch (error: any) {
      console.error('Error:', error);
      return jsonResponse({ error: 'Internal Server Error', message: error.message }, 500, origin);
    }
  },
};
