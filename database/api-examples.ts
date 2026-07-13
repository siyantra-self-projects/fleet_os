/**
 * FLEET MANAGEMENT PLATFORM - API EXAMPLES
 * Cloudflare Workers + D1 Integration Examples
 * 
 * This file demonstrates how to build API endpoints for the fleet management platform
 * using Cloudflare Workers and D1 database.
 */

// Environment interface for TypeScript
export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

// ============================================
// AUTHENTICATION HELPERS
// ============================================

import bcrypt from 'bcryptjs';
import jwt from '@tsndr/cloudflare-worker-jwt';

interface JWTPayload {
  userId: number;
  email: string;
  role: string;
}

/**
 * Hash a password using bcrypt
 */
async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

/**
 * Verify a password against a hash
 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token
 */
async function generateToken(payload: JWTPayload, secret: string): Promise<string> {
  return await jwt.sign(payload, secret, { expiresIn: '7d' });
}

/**
 * Verify and decode a JWT token
 */
async function verifyToken(token: string, secret: string): Promise<JWTPayload | null> {
  const isValid = await jwt.verify(token, secret);
  if (!isValid) return null;
  
  const decoded = jwt.decode(token);
  return decoded.payload as JWTPayload;
}

/**
 * Extract user from Authorization header
 */
async function getUserFromRequest(request: Request, env: Env): Promise<JWTPayload | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  return await verifyToken(token, env.JWT_SECRET);
}

// ============================================
// CORS HELPERS
// ============================================

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
    },
  });
}

// ============================================
// AUTH ENDPOINTS
// ============================================

/**
 * POST /api/auth/register
 * Register a new user account
 */
async function handleRegister(request: Request, env: Env) {
  const body: any = await request.json();
  const { email, password, companyName, currency } = body;

  // Validate input
  if (!email || !password || !companyName) {
    return jsonResponse({ error: 'Missing required fields' }, 400);
  }

  // Check if email exists
  const existing = await env.DB.prepare(
    'SELECT id FROM user_accounts WHERE email = ?'
  ).bind(email).first();

  if (existing) {
    return jsonResponse({ error: 'Email already registered' }, 409);
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Insert user
  const result = await env.DB.prepare(
    `INSERT INTO user_accounts (email, password_hash, company_name, currency, onboarded, role, plan, status)
     VALUES (?, ?, ?, ?, 0, 'user', 'Free', 'Active')`
  ).bind(email, passwordHash, companyName, currency || 'GBP (£)').run();

  // Generate token
  const userId = result.meta.last_row_id as number;
  const token = await generateToken({ userId, email, role: 'user' }, env.JWT_SECRET);

  return jsonResponse({
    success: true,
    token,
    user: { id: userId, email, companyName, currency: currency || 'GBP (£)' }
  }, 201);
}

/**
 * POST /api/auth/login
 * Login with email and password
 */
async function handleLogin(request: Request, env: Env) {
  const body: any = await request.json();
  const { email, password } = body;

  // Find user
  const user = await env.DB.prepare(
    'SELECT id, email, password_hash, company_name, role, status FROM user_accounts WHERE email = ?'
  ).bind(email).first();

  if (!user) {
    return jsonResponse({ error: 'Invalid credentials' }, 401);
  }

  // Check status
  if (user.status !== 'Active') {
    return jsonResponse({ error: 'Account is suspended' }, 403);
  }

  // Verify password
  const isValid = await verifyPassword(password, user.password_hash as string);
  if (!isValid) {
    return jsonResponse({ error: 'Invalid credentials' }, 401);
  }

  // Generate token
  const token = await generateToken(
    { userId: user.id as number, email: user.email as string, role: user.role as string },
    env.JWT_SECRET
  );

  return jsonResponse({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      companyName: user.company_name,
      role: user.role
    }
  });
}

// ============================================
// DRIVER ENDPOINTS
// ============================================

/**
 * GET /api/drivers
 * Get all drivers for the authenticated user
 */
async function handleGetDrivers(request: Request, env: Env, user: JWTPayload) {
  const { results } = await env.DB.prepare(
    'SELECT id, name, phone, license, status, created_at, updated_at FROM drivers WHERE user_id = ? ORDER BY name'
  ).bind(user.userId).all();

  return jsonResponse({ success: true, data: results });
}

/**
 * POST /api/drivers
 * Create a new driver
 */
async function handleCreateDriver(request: Request, env: Env, user: JWTPayload) {
  const body: any = await request.json();
  const { id, name, phone, license, status } = body;

  if (!id || !name || !phone || !license) {
    return jsonResponse({ error: 'Missing required fields' }, 400);
  }

  await env.DB.prepare(
    `INSERT INTO drivers (id, user_id, name, phone, license, status)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(id, user.userId, name, phone, license, status || 'Active').run();

  return jsonResponse({ success: true, id }, 201);
}

/**
 * PUT /api/drivers/:id
 * Update a driver
 */
async function handleUpdateDriver(request: Request, env: Env, user: JWTPayload, driverId: string) {
  const body: any = await request.json();
  const { name, phone, license, status } = body;

  await env.DB.prepare(
    `UPDATE drivers SET name = ?, phone = ?, license = ?, status = ? 
     WHERE id = ? AND user_id = ?`
  ).bind(name, phone, license, status, driverId, user.userId).run();

  return jsonResponse({ success: true });
}

/**
 * DELETE /api/drivers/:id
 * Delete a driver
 */
async function handleDeleteDriver(request: Request, env: Env, user: JWTPayload, driverId: string) {
  await env.DB.prepare(
    'DELETE FROM drivers WHERE id = ? AND user_id = ?'
  ).bind(driverId, user.userId).run();

  return jsonResponse({ success: true });
}

// ============================================
// VEHICLE ENDPOINTS
// ============================================

/**
 * GET /api/vehicles
 * Get all vehicles for the authenticated user
 */
async function handleGetVehicles(request: Request, env: Env, user: JWTPayload) {
  const { results } = await env.DB.prepare(
    'SELECT id, reg, name, type, status, created_at, updated_at FROM vehicles WHERE user_id = ? ORDER BY name'
  ).bind(user.userId).all();

  return jsonResponse({ success: true, data: results });
}

/**
 * POST /api/vehicles
 * Create a new vehicle
 */
async function handleCreateVehicle(request: Request, env: Env, user: JWTPayload) {
  const body: any = await request.json();
  const { id, reg, name, type, status } = body;

  if (!id || !reg || !name || !type) {
    return jsonResponse({ error: 'Missing required fields' }, 400);
  }

  await env.DB.prepare(
    `INSERT INTO vehicles (id, user_id, reg, name, type, status)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(id, user.userId, reg, name, type, status || 'Active').run();

  return jsonResponse({ success: true, id }, 201);
}

// ============================================
// ORDER ENDPOINTS
// ============================================

/**
 * GET /api/orders
 * Get all orders with optional filtering
 */
async function handleGetOrders(request: Request, env: Env, user: JWTPayload) {
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const dateFrom = url.searchParams.get('dateFrom');
  const dateTo = url.searchParams.get('dateTo');

  let query = `
    SELECT o.*, 
           d.name as driver_name,
           v.reg as vehicle_reg,
           r.name as route_name
    FROM orders o
    LEFT JOIN drivers d ON o.driver_id = d.id
    LEFT JOIN vehicles v ON o.vehicle_id = v.id
    LEFT JOIN routes r ON o.route_id = r.id
    WHERE o.user_id = ?
  `;
  const params: any[] = [user.userId];

  if (status) {
    query += ' AND o.status = ?';
    params.push(status);
  }

  if (dateFrom) {
    query += ' AND o.date >= ?';
    params.push(dateFrom);
  }

  if (dateTo) {
    query += ' AND o.date <= ?';
    params.push(dateTo);
  }

  query += ' ORDER BY o.date DESC';

  const stmt = env.DB.prepare(query);
  const { results } = await stmt.bind(...params).all();

  return jsonResponse({ success: true, data: results });
}

/**
 * POST /api/orders
 * Create a new order
 */
async function handleCreateOrder(request: Request, env: Env, user: JWTPayload) {
  const body: any = await request.json();
  const { id, date, driverId, vehicleId, routeId, status } = body;

  if (!id || !date) {
    return jsonResponse({ error: 'Missing required fields' }, 400);
  }

  await env.DB.prepare(
    `INSERT INTO orders (id, user_id, date, driver_id, vehicle_id, route_id, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, user.userId, date, driverId, vehicleId, routeId, status || 'Assigned').run();

  return jsonResponse({ success: true, id }, 201);
}

// ============================================
// FUEL ENDPOINTS
// ============================================

/**
 * GET /api/fuel
 * Get fuel entries with analytics
 */
async function handleGetFuel(request: Request, env: Env, user: JWTPayload) {
  const { results } = await env.DB.prepare(`
    SELECT f.*,
           d.name as driver_name,
           v.reg as vehicle_reg,
           r.name as route_name
    FROM fuel_entries f
    LEFT JOIN drivers d ON f.driver_id = d.id
    LEFT JOIN vehicles v ON f.vehicle_id = v.id
    LEFT JOIN routes r ON f.route_id = r.id
    WHERE f.user_id = ?
    ORDER BY f.date DESC
  `).bind(user.userId).all();

  // Calculate totals
  const totals = {
    totalCost: 0,
    totalLitres: 0,
    totalMiles: 0,
    avgEfficiency: 0,
  };

  results.forEach((entry: any) => {
    totals.totalCost += entry.cost;
    totals.totalLitres += entry.litres;
    totals.totalMiles += entry.miles;
  });

  if (totals.totalLitres > 0) {
    // MPG = (total miles / total litres) * 4.546 (litres to gallons)
    totals.avgEfficiency = (totals.totalMiles / totals.totalLitres) * 4.546;
  }

  return jsonResponse({ success: true, data: results, totals });
}

/**
 * POST /api/fuel
 * Create a fuel entry
 */
async function handleCreateFuel(request: Request, env: Env, user: JWTPayload) {
  const body: any = await request.json();
  const { id, date, driverId, vehicleId, routeId, litres, miles, cost } = body;

  if (!id || !date || !driverId || !vehicleId || !routeId || litres == null || miles == null || cost == null) {
    return jsonResponse({ error: 'Missing required fields' }, 400);
  }

  await env.DB.prepare(
    `INSERT INTO fuel_entries (id, user_id, date, driver_id, vehicle_id, route_id, litres, miles, cost)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, user.userId, date, driverId, vehicleId, routeId, litres, miles, cost).run();

  return jsonResponse({ success: true, id }, 201);
}

// ============================================
// FINANCIAL ANALYTICS ENDPOINTS
// ============================================

/**
 * GET /api/analytics/financial
 * Get financial summary and analytics
 */
async function handleGetFinancialAnalytics(request: Request, env: Env, user: JWTPayload) {
  // Get totals from each category
  const fuelTotal = await env.DB.prepare(
    'SELECT COALESCE(SUM(cost), 0) as total FROM fuel_entries WHERE user_id = ?'
  ).bind(user.userId).first();

  const garageTotal = await env.DB.prepare(
    'SELECT COALESCE(SUM(cost), 0) as total FROM garage_entries WHERE user_id = ?'
  ).bind(user.userId).first();

  const payrollTotal = await env.DB.prepare(
    'SELECT COALESCE(SUM(total_paid), 0) as total FROM payroll_entries WHERE user_id = ?'
  ).bind(user.userId).first();

  const revenueTotal = await env.DB.prepare(
    'SELECT COALESCE(SUM(amount), 0) as total FROM settlements WHERE user_id = ?'
  ).bind(user.userId).first();

  const fuel = (fuelTotal?.total as number) || 0;
  const garage = (garageTotal?.total as number) || 0;
  const payroll = (payrollTotal?.total as number) || 0;
  const revenue = (revenueTotal?.total as number) || 0;
  
  const expenses = fuel + garage + payroll;
  const netProfit = revenue - expenses;
  const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  // Get monthly trend
  const monthlyTrend = await env.DB.prepare(`
    SELECT 
      strftime('%Y-%m', date) as month,
      COALESCE(SUM(amount), 0) as revenue
    FROM settlements
    WHERE user_id = ?
    GROUP BY month
    ORDER BY month DESC
    LIMIT 12
  `).bind(user.userId).all();

  return jsonResponse({
    success: true,
    data: {
      revenue,
      expenses: { fuel, garage, payroll, total: expenses },
      netProfit,
      margin: Math.round(margin * 10) / 10,
      monthlyTrend: monthlyTrend.results,
    }
  });
}

/**
 * GET /api/analytics/dashboard
 * Get dashboard KPIs
 */
async function handleGetDashboardAnalytics(request: Request, env: Env, user: JWTPayload) {
  const activeDrivers = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM drivers WHERE user_id = ? AND status = "Active"'
  ).bind(user.userId).first();

  const totalDrivers = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM drivers WHERE user_id = ?'
  ).bind(user.userId).first();

  const activeVehicles = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM vehicles WHERE user_id = ? AND status = "Active"'
  ).bind(user.userId).first();

  const totalVehicles = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM vehicles WHERE user_id = ?'
  ).bind(user.userId).first();

  const pendingOrders = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM orders WHERE user_id = ? AND status = "Assigned"'
  ).bind(user.userId).first();

  const completedOrders = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM orders WHERE user_id = ? AND status = "Completed"'
  ).bind(user.userId).first();

  return jsonResponse({
    success: true,
    data: {
      drivers: {
        active: (activeDrivers?.count as number) || 0,
        total: (totalDrivers?.count as number) || 0,
      },
      vehicles: {
        active: (activeVehicles?.count as number) || 0,
        total: (totalVehicles?.count as number) || 0,
      },
      orders: {
        pending: (pendingOrders?.count as number) || 0,
        completed: (completedOrders?.count as number) || 0,
      }
    }
  });
}

// ============================================
// MAIN ROUTER
// ============================================

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Public routes (no auth required)
      if (path === '/api/auth/register' && request.method === 'POST') {
        return await handleRegister(request, env);
      }

      if (path === '/api/auth/login' && request.method === 'POST') {
        return await handleLogin(request, env);
      }

      // Protected routes (auth required)
      const user = await getUserFromRequest(request, env);
      if (!user) {
        return jsonResponse({ error: 'Unauthorized' }, 401);
      }

      // Driver routes
      if (path === '/api/drivers' && request.method === 'GET') {
        return await handleGetDrivers(request, env, user);
      }
      if (path === '/api/drivers' && request.method === 'POST') {
        return await handleCreateDriver(request, env, user);
      }
      if (path.startsWith('/api/drivers/') && request.method === 'PUT') {
        const driverId = path.split('/')[3];
        return await handleUpdateDriver(request, env, user, driverId);
      }
      if (path.startsWith('/api/drivers/') && request.method === 'DELETE') {
        const driverId = path.split('/')[3];
        return await handleDeleteDriver(request, env, user, driverId);
      }

      // Vehicle routes
      if (path === '/api/vehicles' && request.method === 'GET') {
        return await handleGetVehicles(request, env, user);
      }
      if (path === '/api/vehicles' && request.method === 'POST') {
        return await handleCreateVehicle(request, env, user);
      }

      // Order routes
      if (path === '/api/orders' && request.method === 'GET') {
        return await handleGetOrders(request, env, user);
      }
      if (path === '/api/orders' && request.method === 'POST') {
        return await handleCreateOrder(request, env, user);
      }

      // Fuel routes
      if (path === '/api/fuel' && request.method === 'GET') {
        return await handleGetFuel(request, env, user);
      }
      if (path === '/api/fuel' && request.method === 'POST') {
        return await handleCreateFuel(request, env, user);
      }

      // Analytics routes
      if (path === '/api/analytics/financial' && request.method === 'GET') {
        return await handleGetFinancialAnalytics(request, env, user);
      }
      if (path === '/api/analytics/dashboard' && request.method === 'GET') {
        return await handleGetDashboardAnalytics(request, env, user);
      }

      return jsonResponse({ error: 'Not Found' }, 404);

    } catch (error) {
      console.error('Error:', error);
      return jsonResponse({ error: 'Internal Server Error' }, 500);
    }
  },
};
