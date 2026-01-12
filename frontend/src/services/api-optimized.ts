/**
 * Optimized API Service with:
 * - Request deduplication
 * - Response caching
 * - Request batching
 * - Retry logic
 * - Performance monitoring
 */

const API_BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || 'http://localhost:5000';
const API_BASE_URL = `${API_BASE}/api`;

// Cache for GET requests
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// Pending requests (deduplication)
const pendingRequests = new Map<string, Promise<any>>();

// Performance metrics
const metrics = {
  totalRequests: 0,
  cacheHits: 0,
  cacheMisses: 0,
  averageResponseTime: 0
};

type RequestOptions = RequestInit & { 
  headers?: Record<string, string>;
  cache?: boolean; // Enable caching
  cacheTTL?: number; // Cache time to live in ms
  retry?: number; // Number of retries
};

/**
 * Get cache key from endpoint and options
 */
function getCacheKey(endpoint: string, options: RequestOptions): string {
  const method = options.method || 'GET';
  const body = options.body ? JSON.stringify(options.body) : '';
  return `${method}:${endpoint}:${body}`;
}

/**
 * Check if cached response is still valid
 */
function isCacheValid(cacheKey: string): boolean {
  const cached = cache.get(cacheKey);
  if (!cached) return false;
  
  const now = Date.now();
  return (now - cached.timestamp) < cached.ttl;
}

/**
 * Get cached response
 */
function getCached(cacheKey: string): any | null {
  if (isCacheValid(cacheKey)) {
    metrics.cacheHits++;
    return cache.get(cacheKey)!.data;
  }
  
  cache.delete(cacheKey);
  metrics.cacheMisses++;
  return null;
}

/**
 * Set cache
 */
function setCache(cacheKey: string, data: any, ttl: number): void {
  cache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    ttl
  });
  
  // Auto cleanup after TTL
  setTimeout(() => {
    cache.delete(cacheKey);
  }, ttl);
}

/**
 * Optimized request with caching and deduplication
 */
async function request(endpoint: string, options: RequestOptions = {}) {
  const startTime = performance.now();
  metrics.totalRequests++;
  
  const url = `${API_BASE_URL}${endpoint}`;
  const cacheKey = getCacheKey(endpoint, options);
  
  // Check cache for GET requests
  if (options.method === 'GET' || !options.method) {
    if (options.cache !== false) {
      const cached = getCached(cacheKey);
      if (cached) {
        console.log(`[Cache Hit] ${endpoint}`);
        return cached;
      }
    }
  }
  
  // Request deduplication
  if (pendingRequests.has(cacheKey)) {
    console.log(`[Dedup] ${endpoint}`);
    return pendingRequests.get(cacheKey);
  }
  
  // Create request promise
  const requestPromise = executeRequest(url, options, startTime);
  
  // Store pending request
  pendingRequests.set(cacheKey, requestPromise);
  
  try {
    const result = await requestPromise;
    
    // Cache GET requests
    if ((options.method === 'GET' || !options.method) && options.cache !== false) {
      const ttl = options.cacheTTL || 30000; // Default 30s
      setCache(cacheKey, result, ttl);
    }
    
    return result;
  } finally {
    // Remove from pending
    pendingRequests.delete(cacheKey);
  }
}

/**
 * Execute actual HTTP request
 */
async function executeRequest(url: string, options: RequestOptions, startTime: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  
  const config: RequestInit = {
    ...options,
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  };
  
  try {
    const res = await fetch(url, config);
    clearTimeout(timeoutId);
    
    // Update metrics
    const duration = performance.now() - startTime;
    metrics.averageResponseTime = 
      (metrics.averageResponseTime * (metrics.totalRequests - 1) + duration) / metrics.totalRequests;
    
    if (res.status === 401) {
      handleUnauthorized();
      throw new Error('Phiên làm việc hết hạn. Vui lòng đăng nhập lại.');
    }
    
    const data = await res.json().catch(() => ({}));
    
    if (!res.ok) {
      const message = (data && (data.message || data.error)) || `Yêu cầu thất bại (Mã lỗi: ${res.status})`;
      throw new Error(message);
    }
    
    return data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Kết nối quá hạn. Vui lòng kiểm tra lại đường truyền mạng.');
    }
    
    // Retry logic
    if (options.retry && options.retry > 0) {
      console.log(`[Retry] ${url} (${options.retry} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s
      return executeRequest(url, { ...options, retry: options.retry - 1 }, startTime);
    }
    
    throw error;
  }
}

/**
 * Handle unauthorized (401)
 */
function handleUnauthorized() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('adminToken');
  }
  
  const isAdmin = window.location.pathname.startsWith('/admin');
  const isLoginPage = window.location.pathname === '/login' || 
                      window.location.pathname === '/admin' || 
                      (isAdmin && window.location.pathname.includes('login'));
  
  if (!isLoginPage) {
    window.location.href = isAdmin ? '/admin' : '/login';
  }
}

/**
 * Batch multiple requests into one
 */
async function batchRequest(requests: Array<{ endpoint: string; options?: RequestOptions }>) {
  const promises = requests.map(req => request(req.endpoint, req.options));
  return Promise.all(promises);
}

/**
 * Prefetch data (load in background)
 */
function prefetch(endpoint: string, options: RequestOptions = {}) {
  // Don't await, just trigger the request
  request(endpoint, { ...options, cache: true }).catch(() => {
    // Ignore errors for prefetch
  });
}

/**
 * Clear cache
 */
function clearCache(pattern?: string) {
  if (pattern) {
    // Clear specific pattern
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  } else {
    // Clear all
    cache.clear();
  }
}

/**
 * Get performance metrics
 */
function getMetrics() {
  return {
    ...metrics,
    cacheSize: cache.size,
    cacheHitRate: metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses) * 100
  };
}

// Helper functions
function adminTokenHeader() {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('adminToken') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function userTokenHeader() {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Export optimized API
export default {
  // Utility functions
  batchRequest,
  prefetch,
  clearCache,
  getMetrics,
  
  // Admin APIs (with caching)
  adminLogin(username: string, password: string) {
    return request('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      cache: 'no-store'
    });
  },
  
  adminProfile() {
    return request('/admin/profile', {
      headers: adminTokenHeader() as Record<string, string>,
      cache: true,
      cacheTTL: 60000 // 1 minute
    });
  },
  
  adminDashboardStats() {
    return request('/admin/dashboard/stats', {
      headers: adminTokenHeader() as Record<string, string>,
      cache: true,
      cacheTTL: 30000 // 30 seconds
    });
  },
  
  adminListUsers(params: any = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/users?${query}`, {
      headers: adminTokenHeader() as Record<string, string>,
      cache: true,
      cacheTTL: 10000 // 10 seconds
    });
  },
  
  // User APIs (with caching)
  getProfile() {
    return request('/auth/profile', {
      headers: userTokenHeader() as Record<string, string>,
      cache: true,
      cacheTTL: 60000 // 1 minute
    });
  },
  
  getOrderStats() {
    return request('/orders/stats', {
      headers: userTokenHeader() as Record<string, string>,
      cache: true,
      cacheTTL: 5000 // 5 seconds
    });
  },
  
  getVipLevels() {
    return request('/vip/levels', {
      cache: true,
      cacheTTL: 3600000 // 1 hour (static data)
    });
  },
  
  takeOrder(product: any, idempotencyKey: string) {
    return request('/orders/take', {
      method: 'POST',
      headers: {
        ...userTokenHeader(),
        'X-Idempotency-Key': idempotencyKey
      } as Record<string, string>,
      body: JSON.stringify({ product }),
      cache: 'no-store',
      retry: 2 // Retry twice on failure
    });
  },
  
  // Batch operations
  async getDashboardData() {
    return batchRequest([
      { endpoint: '/admin/dashboard/stats', options: { headers: adminTokenHeader() as Record<string, string> } },
      { endpoint: '/admin/dashboard/recent-users', options: { headers: adminTokenHeader() as Record<string, string> } }
    ]);
  },
  
  async getUserDashboard() {
    return batchRequest([
      { endpoint: '/orders/stats', options: { headers: userTokenHeader() as Record<string, string> } },
      { endpoint: '/vip/status', options: { headers: userTokenHeader() as Record<string, string> } }
    ]);
  }
};
