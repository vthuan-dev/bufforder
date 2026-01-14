const API_BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || 'http://localhost:5000';
const API_BASE_URL = `${API_BASE}/api`;

// ⚡ Performance Optimization: Cache for GET requests
const responseCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const pendingRequests = new Map<string, Promise<any>>();

type RequestOptions = Omit<RequestInit, 'cache'> & {
  headers?: Record<string, string>;
  useCache?: boolean;
  cacheTTL?: number;
};

function getCacheKey(endpoint: string, options: RequestOptions): string {
  const method = options.method || 'GET';
  return `${method}:${endpoint}`;
}

function getCached(key: string): any | null {
  const cached = responseCache.get(key);
  if (!cached) return null;

  if (Date.now() - cached.timestamp < cached.ttl) {
    console.log(`[Cache Hit] ${key}`);
    return cached.data;
  }

  responseCache.delete(key);
  return null;
}

function setCache(key: string, data: any, ttl: number): void {
  responseCache.set(key, { data, timestamp: Date.now(), ttl });
  setTimeout(() => responseCache.delete(key), ttl);
}

async function request(endpoint: string, options: RequestOptions = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const cacheKey = getCacheKey(endpoint, options);

  // ⚡ Check cache for GET requests
  if ((options.method === 'GET' || !options.method) && options.useCache !== false) {
    const cached = getCached(cacheKey);
    if (cached) return cached;
  }

  // ⚡ Request deduplication
  if (pendingRequests.has(cacheKey)) {
    console.log(`[Dedup] ${endpoint}`);
    return pendingRequests.get(cacheKey);
  }

  // Create an abort controller for timeouts
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

  const headers: Record<string, string> = {
    ...(options.headers || {}),
  };

  // ⚡ Only set JSON content type if not sending FormData
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const config: RequestInit = {
    ...options,
    signal: controller.signal,
    headers,
  };

  const requestPromise = (async () => {
    try {
      const res = await fetch(url, config);
      clearTimeout(timeoutId);

      // Parse response body first to get error message
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        // Check if this is a login attempt (has error message from backend like "Invalid credentials")
        const backendMessage = data?.message || data?.error;
        const isLoginEndpoint = endpoint.includes('/login');

        if (isLoginEndpoint && backendMessage) {
          // This is a failed login attempt, show backend message
          throw new Error(backendMessage);
        }

        // Session expired - clear ALL tokens, data and cache
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminData');
        }

        // Clear response cache to prevent stale data
        responseCache.clear();
        pendingRequests.clear();

        // Check if we are in admin mode or regular mode
        const isAdmin = window.location.pathname.startsWith('/admin');

        // Only redirect if not already on a login page to avoid infinite loops
        const isLoginPage = window.location.pathname === '/login' ||
          window.location.pathname === '/admin/login' ||
          window.location.pathname === '/admin';

        if (!isLoginPage) {
          // Use replace to prevent back button issues
          if (isAdmin) {
            window.location.replace('/admin/login');
          } else {
            window.location.replace('/login');
          }
          // Return early to prevent further execution
          return { success: false, message: 'Session expired' };
        }

        throw new Error('Session expired. Please log in again.');
      }

      if (!res.ok) {
        const message = (data && (data.message || data.error)) || `Request failed (Error code: ${res.status})`;
        throw new Error(message);
      }

      // ⚡ Cache successful GET responses
      if ((options.method === 'GET' || !options.method) && options.useCache !== false) {
        const ttl = options.cacheTTL || 30000; // Default 30s
        setCache(cacheKey, data, ttl);
      }

      return data;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Connection timeout. Please check your network.');
      }
      throw error;
    }
  })();

  // Store pending request
  pendingRequests.set(cacheKey, requestPromise);

  try {
    return await requestPromise;
  } finally {
    pendingRequests.delete(cacheKey);
  }
}

function adminTokenHeader() {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('adminToken') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default {
  // ⚡ Utility: Clear cache
  clearCache() {
    responseCache.clear();
    console.log('[Cache] Cleared all cache');
  },

  // ----- Admin -----
  adminLogin(username: string, password: string) {
    return request('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      useCache: false
    });
  },
  adminProfile() {
    const headers: Record<string, string> = { ...adminTokenHeader() } as Record<string, string>;
    return request('/admin/profile', {
      headers,
      useCache: true,
      cacheTTL: 60000 // ⚡ Cache 1 minute
    });
  },
  
  // IP Location lookup
  getIpLocation(ip: string) {
    const headers: Record<string, string> = { ...adminTokenHeader() } as Record<string, string>;
    return request(`/admin/ip-location/${ip}`, { headers, useCache: true, cacheTTL: 3600000 });
  },

  adminDeleteUser(id: string) {
    const headers: Record<string, string> = { ...adminTokenHeader() } as Record<string, string>;
    return request(`/admin/users/${id}`, { method: 'DELETE', headers });
  },
  adminUpdateUser(id: string, payload: { fullName?: string; email?: string; phoneNumber?: string; password?: string; vipLevel?: string; balance?: number; isActive?: boolean; }) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...adminTokenHeader() } as Record<string, string>;
    return request(`/admin/users/${id}`, { method: 'PUT', headers, body: JSON.stringify(payload) });
  },

  // Admin - Deposit requests
  adminListDepositRequests({ status = 'pending', page = 1, limit = 20 }: { status?: string; page?: number; limit?: number } = {}) {
    const params = new URLSearchParams();
    params.set('status', status);
    params.set('page', String(page));
    params.set('limit', String(limit));
    const headers: Record<string, string> = { ...adminTokenHeader() } as Record<string, string>;
    return request(`/admin/deposit-requests?${params.toString()}`, { headers });
  },
  adminApproveDeposit(id: string, notes?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...adminTokenHeader() } as Record<string, string>;
    return request(`/admin/deposit-requests/${id}/approve`, { method: 'POST', headers, body: JSON.stringify({ notes }) });
  },
  adminRejectDeposit(id: string, rejectionReason: string, notes?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...adminTokenHeader() } as Record<string, string>;
    return request(`/admin/deposit-requests/${id}/reject`, { method: 'POST', headers, body: JSON.stringify({ rejectionReason, notes }) });
  },

  // Admin - Withdrawal requests
  adminListWithdrawalRequests({ status = 'pending', page = 1, limit = 20 }: { status?: string; page?: number; limit?: number } = {}) {
    const params = new URLSearchParams();
    params.set('status', status);
    params.set('page', String(page));
    params.set('limit', String(limit));
    const headers: Record<string, string> = { ...adminTokenHeader() } as Record<string, string>;
    return request(`/admin/withdrawal-requests?${params.toString()}`, { headers });
  },
  adminApproveWithdrawal(id: string, notes?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...adminTokenHeader() } as Record<string, string>;
    return request(`/admin/withdrawal-requests/${id}/approve`, { method: 'POST', headers, body: JSON.stringify({ notes }) });
  },
  adminRejectWithdrawal(id: string, reason: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...adminTokenHeader() } as Record<string, string>;
    return request(`/admin/withdrawal-requests/${id}/reject`, { method: 'POST', headers, body: JSON.stringify({ reason }) });
  },

  // ----- User -----
  login(phoneNumber: string, password: string) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, password }),
    });
  },
  register({ phoneNumber, password, fullName, inviteCode }: { phoneNumber: string; password: string; fullName: string; inviteCode: string; }) {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, password, fullName, inviteCode }),
    });
  },
  profile(token?: string) {
    const t = token || (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);
    const headers: Record<string, string> = {};
    if (t) headers.Authorization = `Bearer ${t}`;
    return request('/auth/profile', { headers });
  },

  // Orders for user
  userOrderStats(token?: string) {
    const t = token || (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);
    const headers: Record<string, string> = {};
    if (t) headers.Authorization = `Bearer ${t}`;
    return request('/orders/stats', { headers });
  },
  userOrderHistory({ status, page = 1, limit = 20, sortBy = 'orderDate', sortOrder = 'desc' }: { status?: string; page?: number; limit?: number; sortBy?: string; sortOrder?: string } = {}, token?: string) {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    params.set('page', String(page));
    params.set('limit', String(limit));
    params.set('sortBy', sortBy);
    params.set('sortOrder', sortOrder);
    const t = token || (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);
    const headers: Record<string, string> = {};
    if (t) headers.Authorization = `Bearer ${t}`;
    return request(`/orders/history?${params.toString()}`, { headers });
  },
  userOrderTake(product: { id: number | string; name: string; price: number; brand: string; category: string; image: string }, idempotencyKey?: string, token?: string) {
    const t = token || (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (t) headers.Authorization = `Bearer ${t}`;
    if (idempotencyKey) headers['X-Idempotency-Key'] = idempotencyKey;
    return request('/orders/take', { method: 'POST', headers, body: JSON.stringify({ product, idempotencyKey }) });
  },
  userOrderComplete(productData: { productId: number | string; productName: string; productPrice: number; commissionAmount: number; commissionRate: number }, token?: string) {
    const t = token || (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (t) headers.Authorization = `Bearer ${t}`;
    return request('/orders/complete', { method: 'POST', headers, body: JSON.stringify({ productData }) });
  },

  // ----- VIP (deposit/withdrawal/bank cards) -----
  deposit(amount: number, token?: string) {
    const t = token || (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (t) headers.Authorization = `Bearer ${t}`;
    return request('/vip/deposit', { method: 'POST', headers, body: JSON.stringify({ amount }) });
  },
  getBankCards(token?: string) {
    const t = token || (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);
    const headers: Record<string, string> = {};
    if (t) headers.Authorization = `Bearer ${t}`;
    return request('/vip/bank-cards', { headers });
  },
  addBankCard({ bankName, cardNumber, accountName, isDefault }: { bankName: string; cardNumber: string; accountName: string; isDefault?: boolean; }, token?: string) {
    const t = token || (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (t) headers.Authorization = `Bearer ${t}`;
    return request('/vip/bank-cards', { method: 'POST', headers, body: JSON.stringify({ bankName, cardNumber, accountName, isDefault }) });
  },
  deleteBankCard(id: string, token?: string) {
    const t = token || (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);
    const headers: Record<string, string> = {};
    if (t) headers.Authorization = `Bearer ${t}`;
    return request(`/vip/bank-cards/${id}`, { method: 'DELETE', headers });
  },
  withdrawal({ amount, bankCardId, password, token }: { amount: number; bankCardId: string; password: string; token?: string; }) {
    const t = token || (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (t) headers.Authorization = `Bearer ${t}`;
    return request('/vip/withdrawal', { method: 'POST', headers, body: JSON.stringify({ amount, bankCardId, password }) });
  },

  // VIP info
  vipLevels() {
    return request('/vip/levels');
  },
  vipStatus(token?: string) {
    const t = token || (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);
    const headers: Record<string, string> = {};
    if (t) headers.Authorization = `Bearer ${t}`;
    return request('/vip/status', { headers });
  },

  getDepositRequests(token?: string) {
    const t = token || (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);
    const headers: Record<string, string> = {};
    if (t) headers.Authorization = `Bearer ${t}`;
    return request('/vip/deposit-requests', { headers });
  },
  getWithdrawalRequests(token?: string) {
    const t = token || (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);
    const headers: Record<string, string> = {};
    if (t) headers.Authorization = `Bearer ${t}`;
    return request('/vip/withdrawal-requests', { headers });
  },

  // Addresses
  getAddresses(token?: string) {
    const t = token || (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);
    const headers: Record<string, string> = {};
    if (t) headers.Authorization = `Bearer ${t}`;
    return request('/auth/addresses', { headers });
  },
  addAddress(payload: { fullName: string; phoneNumber: string; addressLine1: string; city: string; postalCode: string; isDefault?: boolean; }, token?: string) {
    const t = token || (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (t) headers.Authorization = `Bearer ${t}`;
    return request('/auth/address', { method: 'POST', headers, body: JSON.stringify(payload) });
  },
  deleteAddress(addressId: string, token?: string) {
    const t = token || (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);
    const headers: Record<string, string> = {};
    if (t) headers.Authorization = `Bearer ${t}`;
    return request(`/auth/address/${addressId}`, { method: 'DELETE', headers });
  },

  changePassword({ currentPassword, newPassword, token }: { currentPassword: string; newPassword: string; token?: string; }) {
    const t = token || (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (t) headers.Authorization = `Bearer ${t}`;
    return request('/auth/change-password', { method: 'POST', headers, body: JSON.stringify({ currentPassword, newPassword }) });
  },

  // ---- Admin Chat ----
  adminChatListThreads({ page = 1, limit = 20, q = '' }: { page?: number; limit?: number; q?: string } = {}) {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (q) params.set('q', q);
    const headers: Record<string, string> = { ...adminTokenHeader() } as Record<string, string>;
    return request(`/chat/admin/threads?${params.toString()}`, { headers });
  },

  // ---- User Chat ----
  chatOpenThread(token?: string) {
    const t = token || (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (t) headers.Authorization = `Bearer ${t}`;
    return request('/chat/thread', { method: 'POST', headers, body: JSON.stringify({}) });
  },
  chatListMessages(threadId: string, token?: string) {
    const t = token || (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);
    const headers: Record<string, string> = {};
    if (t) headers.Authorization = `Bearer ${t}`;
    return request(`/chat/thread/${threadId}/messages`, { headers });
  },
  chatSendMessage(threadId: string, text: string, token?: string) {
    const t = token || (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (t) headers.Authorization = `Bearer ${t}`;
    return request(`/chat/thread/${threadId}/messages`, { method: 'POST', headers, body: JSON.stringify({ text }) });
  },
  chatSendImage(threadId: string, file: File, token?: string) {
    const t = token || (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);
    const headers: Record<string, string> = {};
    if (t) headers.Authorization = `Bearer ${t}`;
    const form = new FormData();
    form.append('image', file);
    // Use fetch directly to preserve FormData headers
    return fetch(`${API_BASE_URL}/chat/thread/${threadId}/images`, {
      method: 'POST',
      headers: headers as any,
      body: form as any,
    }).then(async (r) => {
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d?.message || `Upload failed (${r.status})`);
      return d;
    });
  },
  adminChatSendImage(threadId: string, file: File) {
    const headers: Record<string, string> = { ...adminTokenHeader() } as Record<string, string>;
    const form = new FormData();
    form.append('image', file);
    return fetch(`${API_BASE_URL}/chat/admin/threads/${threadId}/images`, {
      method: 'POST',
      headers: headers as any,
      body: form as any,
    }).then(async (r) => {
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d?.message || `Upload failed (${r.status})`);
      return d;
    });
  },
  adminChatListMessages(threadId: string) {
    const headers: Record<string, string> = { ...adminTokenHeader() } as Record<string, string>;
    return request(`/chat/admin/threads/${threadId}/messages`, { headers });
  },
  adminChatSendMessage(threadId: string, text: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...adminTokenHeader() } as Record<string, string>;
    return request(`/chat/admin/threads/${threadId}/messages`, { method: 'POST', headers, body: JSON.stringify({ text }) });
  },
  adminChatMarkRead(threadId: string) {
    const headers: Record<string, string> = { ...adminTokenHeader() } as Record<string, string>;
    return request(`/chat/admin/threads/${threadId}/read`, { method: 'POST', headers });
  },
  adminChatDeleteThread(threadId: string) {
    const headers: Record<string, string> = { ...adminTokenHeader() } as Record<string, string>;
    return request(`/chat/admin/threads/${threadId}`, { method: 'DELETE', headers });
  },
  adminChatBlockUser(threadId: string, reason?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...adminTokenHeader() } as Record<string, string>;
    return request(`/chat/admin/threads/${threadId}/block`, { method: 'POST', headers, body: JSON.stringify({ reason }) });
  },
  adminChatGetThread(threadId: string) {
    const headers: Record<string, string> = { ...adminTokenHeader() } as Record<string, string>;
    return request(`/chat/admin/threads/${threadId}`, { headers });
  },

  // =====================
  // ADMIN API ENDPOINTS
  // =====================

  // Admin - Dashboard Tab
  adminGetDashboardStats() {
    const headers: Record<string, string> = { ...adminTokenHeader() } as Record<string, string>;
    return request('/admin/dashboard/stats', {
      headers,
      useCache: true,
      cacheTTL: 30000 // ⚡ Cache 30 seconds
    });
  },
  adminGetWeeklyRevenue() {
    const headers: Record<string, string> = { ...adminTokenHeader() } as Record<string, string>;
    return request('/admin/dashboard/weekly-revenue', {
      headers,
      useCache: true,
      cacheTTL: 60000 // ⚡ Cache 1 minute
    });
  },
  adminGetUserGrowth() {
    const headers: Record<string, string> = { ...adminTokenHeader() } as Record<string, string>;
    return request('/admin/dashboard/user-growth', {
      headers,
      useCache: true,
      cacheTTL: 60000 // ⚡ Cache 1 minute
    });
  },
  adminGetRecentUsers() {
    const headers: Record<string, string> = { ...adminTokenHeader() } as Record<string, string>;
    return request('/admin/dashboard/recent-users', {
      headers,
      useCache: true,
      cacheTTL: 30000 // ⚡ Cache 30 seconds
    });
  },
  adminDownloadReport() {
    const headers: Record<string, string> = { ...adminTokenHeader() } as Record<string, string>;
    return request('/admin/dashboard/download-report', { headers });
  },

  // Admin - Users Tab
  adminListUsers({ page = 1, limit = 20, q = '', status = 'all', vipLevel = 'all', sortBy = 'createdAt', sortOrder = 'desc' }: {
    page?: number;
    limit?: number;
    q?: string;
    status?: string;
    vipLevel?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}) {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (q) params.set('q', q);
    if (status !== 'all') params.set('status', status);
    if (vipLevel !== 'all') params.set('vipLevel', vipLevel);
    params.set('sortBy', sortBy);
    params.set('sortOrder', sortOrder);
    const headers: Record<string, string> = { ...adminTokenHeader() } as Record<string, string>;
    return request(`/admin/users?${params.toString()}`, { headers });
  },
  adminGetUser(id: string) {
    const headers: Record<string, string> = { ...adminTokenHeader() } as Record<string, string>;
    return request(`/admin/users/${id}`, { headers });
  },
  adminGetUserCommissionConfig(id: string) {
    const headers: Record<string, string> = { ...adminTokenHeader() } as Record<string, string>;
    return request(`/admin/users/${id}/commission-config`, { headers });
  },
  adminUpdateUserCommissionConfig(id: string, commissionConfig: any) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...adminTokenHeader() } as Record<string, string>;
    return request(`/admin/users/${id}/commission-config`, { method: 'PATCH', headers, body: JSON.stringify({ commissionConfig }) });
  },
  adminCreateUser(data: { fullName: string; email: string; phoneNumber?: string; password: string; vipLevel?: string; balance?: number; isActive?: boolean; }) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...adminTokenHeader() } as Record<string, string>;
    return request('/admin/users', { method: 'POST', headers, body: JSON.stringify(data) });
  },
  adminUpdateUserStatus(id: string, status: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...adminTokenHeader() } as Record<string, string>;
    return request(`/admin/users/${id}/status`, { method: 'PATCH', headers, body: JSON.stringify({ status }) });
  },
  adminUpdateUserVipLevel(id: string, vipLevel: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...adminTokenHeader() } as Record<string, string>;
    return request(`/admin/users/${id}/vip-level`, { method: 'PATCH', headers, body: JSON.stringify({ vipLevel }) });
  },
  adminGetUserStats() {
    const headers: Record<string, string> = { ...adminTokenHeader() } as Record<string, string>;
    return request('/admin/users/stats', { headers });
  },

  // Note: Deposits/Withdrawals admin endpoints are defined earlier as
  // /admin/deposit-requests and /admin/withdrawal-requests and use POST methods.

  // Admin - Orders Tab
  adminListOrders({ page = 1, limit = 20, q = '', status = 'all', sortBy = 'orderDate', sortOrder = 'desc' }: {
    page?: number;
    limit?: number;
    q?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}) {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (q) params.set('q', q);
    if (status !== 'all') params.set('status', status);
    params.set('sortBy', sortBy);
    params.set('sortOrder', sortOrder);
    const headers: Record<string, string> = { ...adminTokenHeader() } as Record<string, string>;
    return request(`/admin/orders?${params.toString()}`, { headers });
  },
  adminGetOrder(id: string) {
    const headers: Record<string, string> = { ...adminTokenHeader() } as Record<string, string>;
    return request(`/admin/orders/${id}`, { headers });
  },
  adminUpdateOrderStatus(id: string, status: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...adminTokenHeader() } as Record<string, string>;
    return request(`/admin/orders/${id}/status`, { method: 'PATCH', headers, body: JSON.stringify({ status }) });
  },
  adminGetOrderStats() {
    const headers: Record<string, string> = { ...adminTokenHeader() } as Record<string, string>;
    return request('/admin/orders/stats', {
      headers,
      useCache: true,
      cacheTTL: 30000 // ⚡ Cache 30 seconds
    });
  },

  // Admin - Chat Support Tab
  adminGetChatRooms() {
    const headers: Record<string, string> = { ...adminTokenHeader() } as Record<string, string>;
    return request('/admin/chat/rooms', { headers });
  },
  adminGetChatMessages(roomId: string, { page = 1, limit = 50 } = {}) {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    const headers: Record<string, string> = { ...adminTokenHeader() } as Record<string, string>;
    return request(`/admin/chat/rooms/${roomId}/messages?${params.toString()}`, { headers });
  },
  adminSendChatMessage(roomId: string, message: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...adminTokenHeader() } as Record<string, string>;
    return request(`/admin/chat/rooms/${roomId}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message })
    });
  },
  adminGetChatStats() {
    const headers: Record<string, string> = { ...adminTokenHeader() } as Record<string, string>;
    return request('/admin/chat/stats', { headers });
  },

  // Admin - Settings Tab
  adminGetProfile() {
    const headers: Record<string, string> = { ...adminTokenHeader() } as Record<string, string>;
    return request('/admin/profile', { headers });
  },
  adminUpdateProfile(data: { fullName?: string; email?: string; phoneNumber?: string }) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...adminTokenHeader() } as Record<string, string>;
    return request('/admin/profile', { method: 'PATCH', headers, body: JSON.stringify(data) });
  },
  adminUploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('avatar', file);
    const headers: Record<string, string> = { ...adminTokenHeader() } as Record<string, string>;
    return request('/admin/upload-avatar', { method: 'POST', headers, body: formData });
  },
  adminChangePassword(currentPassword: string, newPassword: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...adminTokenHeader() } as Record<string, string>;
    return request('/admin/change-password', {
      method: 'POST',
      headers,
      body: JSON.stringify({ currentPassword, newPassword })
    });
  },

  // Products API (public)
  getProducts() {
    return request('/products', {
      useCache: true,
      cacheTTL: 60000 // Cache 1 minute
    });
  },

  // Admin Products CRUD
  adminListProducts({ page = 1, limit = 20, q = '', category = 'all', isActive = 'all' }: {
    page?: number;
    limit?: number;
    q?: string;
    category?: string;
    isActive?: string;
  } = {}) {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (q) params.set('q', q);
    if (category !== 'all') params.set('category', category);
    if (isActive !== 'all') params.set('isActive', isActive);
    const headers: Record<string, string> = { ...adminTokenHeader() } as Record<string, string>;
    return request(`/admin/products?${params.toString()}`, { headers });
  },
  adminGetProduct(id: number) {
    const headers: Record<string, string> = { ...adminTokenHeader() } as Record<string, string>;
    return request(`/admin/products/${id}`, { headers });
  },
  adminCreateProduct(data: { name: string; brand: string; category: string; price: number; image?: string; isActive?: boolean }) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...adminTokenHeader() } as Record<string, string>;
    return request('/admin/products', { method: 'POST', headers, body: JSON.stringify(data) });
  },
  adminUpdateProduct(id: number, data: { name?: string; brand?: string; category?: string; price?: number; image?: string; isActive?: boolean }) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...adminTokenHeader() } as Record<string, string>;
    return request(`/admin/products/${id}`, { method: 'PUT', headers, body: JSON.stringify(data) });
  },
  adminDeleteProduct(id: number) {
    const headers: Record<string, string> = { ...adminTokenHeader() } as Record<string, string>;
    return request(`/admin/products/${id}`, { method: 'DELETE', headers });
  },
  async adminUploadProductImage(file: File) {
    const formData = new FormData();
    formData.append('image', file);

    const token = localStorage.getItem('adminToken');
    const API_BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || 'http://localhost:5000';

    const res = await fetch(`${API_BASE}/api/admin/products/upload-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Upload failed');
    }
    return data;
  },

  adminGetSystemSettings() {
    const headers: Record<string, string> = { ...adminTokenHeader() } as Record<string, string>;
    return request('/admin/settings/system', { headers });
  },
  adminUpdateSystemSettings(settings: any) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...adminTokenHeader() } as Record<string, string>;
    return request('/admin/settings/system', { method: 'PATCH', headers, body: JSON.stringify(settings) });
  },
};


