const API_BASE_URL = 'https://bufforder.onrender.com/api';

class ApiService {
  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    console.log('Making API request:', { url, method: options.method || 'GET', headers: config.headers });

    try {
      const response = await fetch(url, config);
      console.log('Response status:', response.status, response.statusText);
      
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(phoneNumber, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, password }),
    });
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getProfile(token) {
    return this.request('/auth/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async updateProfile(token, userData) {
    return this.request('/auth/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });
  }

  // VIP related endpoints
  async getVipLevels() {
    return this.request('/vip/levels');
  }

  async getVipStatus(token) {
    return this.request('/vip/status', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async deposit(token, amount) {
    const body = JSON.stringify({ amount });
    console.log('API Service - deposit body:', body);
    console.log('API Service - amount:', amount);
    
    return this.request('/vip/deposit', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body,
    });
  }

  // Get addresses
  async getAddresses(token) {
    return this.request('/auth/addresses', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  // Add address
  async addAddress(token, addressData) {
    return this.request('/auth/address', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(addressData),
    });
  }

  // Delete address
  async deleteAddress(token, addressId) {
    return this.request(`/auth/address/${addressId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  // Withdrawal
  async withdrawal(token, amount, bankCardId) {
    return this.request('/vip/withdrawal', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount, bankCardId }),
    });
  }

  // List user's withdrawal requests
  async getWithdrawalRequests(token) {
    return this.request('/vip/withdrawal-requests', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  // Get bank cards
  async getBankCards(token) {
    return this.request('/vip/bank-cards', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  // Add bank card
  async addBankCard(token, { bankName, cardNumber, accountName, isDefault }) {
    return this.request('/vip/bank-cards', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bankName, cardNumber, accountName, isDefault })
    });
  }

  // Delete bank card
  async deleteBankCard(token, id) {
    return this.request(`/vip/bank-cards/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  // Change password
  async changePassword(token, currentPassword, newPassword) {
    return this.request('/auth/change-password', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Get order stats
  async getOrderStats(token) {
    return this.request('/orders/stats', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  // Get order history
  async getOrderHistory(token, { page = 1, limit = 20, status } = {}) {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (status) params.set('status', status);
    return this.request(`/orders/history?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  // Admin: update order status
  async adminUpdateOrderStatus(orderId, status) {
    return this.request(`/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...this.adminTokenHeader()
      },
      body: JSON.stringify({ status })
    });
  }

  // Take order (client selects product and sends minimal data)
  async takeOrder(token, product) {
    return this.request('/orders/take', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ product })
    });
  }

  // Complete order
  async completeOrder(token, productData) {
    return this.request('/orders/complete', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productData }),
    });
  }

  // Get user's deposit requests
  async getDepositRequests(token) {
    return this.request('/vip/deposit-requests', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // ============ Admin APIs ============
  adminTokenHeader() {
    const token = localStorage.getItem('adminToken');
    console.log('Admin token from localStorage:', token ? 'Present' : 'Missing');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  async adminListUsers({ page = 1, limit = 20, q = '', status } = {}) {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (q) params.set('q', q);
    if (status) params.set('status', status);
    return this.request(`/admin/users?${params.toString()}`, {
      headers: {
        ...this.adminTokenHeader()
      }
    });
  }

  async adminCreateUser(payload) {
    return this.request('/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.adminTokenHeader()
      },
      body: JSON.stringify(payload)
    });
  }

  async adminUpdateUser(id, payload) {
    return this.request(`/admin/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.adminTokenHeader()
      },
      body: JSON.stringify(payload)
    });
  }

  async adminTopupUser(id, amount) {
    return this.request(`/admin/users/${id}/topup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.adminTokenHeader()
      },
      body: JSON.stringify({ amount })
    });
  }

  async adminDeleteUser(id) {
    console.log('Deleting user with ID:', id);
    console.log('Admin token header:', this.adminTokenHeader());
    return this.request(`/admin/users/${id}`, {
      method: 'DELETE',
      headers: {
        ...this.adminTokenHeader()
      }
    });
  }

  async adminChatThreads({ page = 1, limit = 20, q = '' } = {}) {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (q) params.set('q', q);
    return this.request(`/chat/admin/threads?${params.toString()}`, {
      headers: {
        ...this.adminTokenHeader()
      }
    });
  }

  async adminThreadMessages(threadId) {
    return this.request(`/chat/admin/threads/${threadId}/messages`, {
      headers: {
        ...this.adminTokenHeader()
      }
    });
  }

  async adminSendMessage(threadId, text) {
    return this.request(`/chat/admin/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.adminTokenHeader()
      },
      body: JSON.stringify({ text })
    });
  }

  async adminSendImage(threadId, file) {
    const form = new FormData();
    form.append('image', file);
    return fetch(`${API_BASE_URL}/chat/admin/threads/${threadId}/images`, {
      method: 'POST',
      headers: {
        ...this.adminTokenHeader()
      },
      body: form
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload error');
      return data;
    });
  }

  async adminDeleteThread(threadId) {
    return this.request(`/chat/admin/threads/${threadId}`, {
      method: 'DELETE',
      headers: {
        ...this.adminTokenHeader()
      }
    });
  }

  async adminMarkThreadRead(threadId) {
    return this.request(`/chat/admin/threads/${threadId}/read`, {
      method: 'POST',
      headers: {
        ...this.adminTokenHeader()
      }
    });
  }

  async adminGetUserByPhone(phone) {
    return this.request(`/chat/admin/users/by-phone/${phone}`, {
      headers: {
        ...this.adminTokenHeader()
      }
    });
  }

  async adminDashboardStats() {
    return this.request('/admin/dashboard', {
      headers: {
        ...this.adminTokenHeader()
      }
    });
  }

  async adminLogin(username, password) {
    return this.request('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async adminProfile() {
    return this.request('/admin/profile', {
      headers: {
        ...this.adminTokenHeader()
      }
    });
  }

  async adminChangePassword(currentPassword, newPassword) {
    return this.request('/admin/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.adminTokenHeader()
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });
  }

  // ============ Admin Deposit Review ============
  async adminListDepositRequests({ status = 'pending', page = 1, limit = 20 } = {}) {
    const params = new URLSearchParams();
    params.set('status', status);
    params.set('page', String(page));
    params.set('limit', String(limit));
    return this.request(`/admin/deposit-requests?${params.toString()}`, {
      headers: {
        ...this.adminTokenHeader()
      }
    });
  }

  // Admin: Withdrawal requests
  async adminListWithdrawalRequests({ status = 'pending', page = 1, limit = 20 } = {}) {
    const params = new URLSearchParams();
    params.set('status', status);
    params.set('page', String(page));
    params.set('limit', String(limit));
    return this.request(`/admin/withdrawal-requests?${params.toString()}`, {
      headers: {
        ...this.adminTokenHeader()
      }
    });
  }

  async adminApproveWithdrawal(id, notes) {
    return this.request(`/admin/withdrawal-requests/${id}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.adminTokenHeader()
      },
      body: JSON.stringify({ notes })
    });
  }

  async adminRejectWithdrawal(id, reason) {
    return this.request(`/admin/withdrawal-requests/${id}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.adminTokenHeader()
      },
      body: JSON.stringify({ reason })
    });
  }

  async adminApproveDeposit(requestId, notes) {
    return this.request(`/admin/deposit-requests/${requestId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.adminTokenHeader()
      },
      body: JSON.stringify({ notes })
    });
  }

  async adminRejectDeposit(requestId, rejectionReason, notes) {
    return this.request(`/admin/deposit-requests/${requestId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.adminTokenHeader()
      },
      body: JSON.stringify({ rejectionReason, notes })
    });
  }

  // ============ User Chat APIs ============
  userTokenHeader() {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  async userOpenThread() {
    return this.request('/chat/thread', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.userTokenHeader()
      }
    });
  }

  async userThreadMessages(threadId) {
    return this.request(`/chat/thread/${threadId}/messages`, {
      method: 'GET',
      headers: {
        ...this.userTokenHeader()
      }
    });
  }

  async userSendMessage(threadId, text) {
    return this.request(`/chat/thread/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.userTokenHeader()
      },
      body: JSON.stringify({ text })
    });
  }
}

export default new ApiService();
