/**
 * API Client for Fleet Management Platform
 * Handles all communication with Cloudflare Workers API + D1
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private getHeaders(includeAuth = false): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = localStorage.getItem('fleet_os_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(true),
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error: any) {
      console.error('API Error:', error);
      return {
        success: false,
        error: error.message || 'Network error',
      };
    }
  }

  // ============================================
  // AUTH
  // ============================================

  async register(email: string, password: string, companyName: string, currency: string) {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify({ email, password, companyName, currency }),
    });
    const data = await response.json();
    
    if (data.success && data.token) {
      localStorage.setItem('fleet_os_token', data.token);
      localStorage.setItem('fleet_os_session', JSON.stringify(data.user));
    }
    
    return data;
  }

  async login(email: string, password: string) {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    
    if (data.success && data.token) {
      localStorage.setItem('fleet_os_token', data.token);
      localStorage.setItem('fleet_os_session', JSON.stringify(data.user));
    }
    
    return data;
  }

  async completeOnboarding(companyName: string, currency: string, driver: any, vehicle: any) {
    return this.request('/api/auth/onboarding', {
      method: 'POST',
      body: JSON.stringify({ companyName, currency, driver, vehicle }),
    });
  }

  logout() {
    localStorage.removeItem('fleet_os_token');
    localStorage.removeItem('fleet_os_session');
  }

  // ============================================
  // DRIVERS
  // ============================================

  async getDrivers() {
    return this.request<any[]>('/api/drivers');
  }

  async createDriver(driver: any) {
    return this.request('/api/drivers', {
      method: 'POST',
      body: JSON.stringify(driver),
    });
  }

  async updateDriver(id: string, driver: any) {
    return this.request(`/api/drivers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(driver),
    });
  }

  async deleteDriver(id: string) {
    return this.request(`/api/drivers/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // VEHICLES
  // ============================================

  async getVehicles() {
    return this.request<any[]>('/api/vehicles');
  }

  async createVehicle(vehicle: any) {
    return this.request('/api/vehicles', {
      method: 'POST',
      body: JSON.stringify(vehicle),
    });
  }

  async updateVehicle(id: string, vehicle: any) {
    return this.request(`/api/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(vehicle),
    });
  }

  async deleteVehicle(id: string) {
    return this.request(`/api/vehicles/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // ROUTES
  // ============================================

  async getRoutes() {
    return this.request<any[]>('/api/routes');
  }

  async createRoute(route: any) {
    return this.request('/api/routes', {
      method: 'POST',
      body: JSON.stringify(route),
    });
  }

  async updateRoute(id: string, route: any) {
    return this.request(`/api/routes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(route),
    });
  }

  async deleteRoute(id: string) {
    return this.request(`/api/routes/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // ORDERS
  // ============================================

  async getOrders() {
    return this.request<any[]>('/api/orders');
  }

  async createOrder(order: any) {
    return this.request('/api/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  }

  async updateOrder(id: string, order: any) {
    return this.request(`/api/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(order),
    });
  }

  async deleteOrder(id: string) {
    return this.request(`/api/orders/${id}`, {
      method: 'DELETE',
    });
  }

  // Add similar methods for Fuel, Garage, Payroll, Settlements...
}

export const api = new ApiClient();
export default api;
