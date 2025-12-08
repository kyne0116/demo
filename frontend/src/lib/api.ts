// API客户端工具 - 用于与后端API通信

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    // 获取认证token
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.message || `HTTP error! status: ${response.status}`,
        };
      }

      return { data };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // 产品相关API
  async getProducts(categoryId?: string) {
    const query = categoryId ? `?categoryId=${categoryId}` : '';
    return this.request(`/products${query}`);
  }

  async getProduct(id: string) {
    return this.request(`/products/${id}`);
  }

  async createProduct(productData: any) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(id: string, productData: any) {
    return this.request(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(id: string) {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // 订单相关API
  async getOrders() {
    return this.request('/orders');
  }

  async getOrder(id: string) {
    return this.request(`/orders/${id}`);
  }

  async createOrder(orderData: {
    customerId?: string;
    staffId: string;
    items: Array<{
      productId: string;
      productName: string;
      unitPrice: number;
      quantity: number;
    }>;
    notes?: string;
    memberInfo?: {
      memberLevel?: string;
      pointsAvailable?: number;
    };
  }) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async updateOrderStatus(id: string, status: string) {
    return this.request(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async cancelOrder(id: string, reason?: string) {
    return this.request(`/orders/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  }

  // 认证相关API
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getProfile() {
    return this.request('/profile');
  }

  // 会员相关API
  async createMember(memberData: {
    email: string;
    password: string;
    phone: string;
    name: string;
    memberNumber?: string;
    referralCode?: string;
  }) {
    return this.request('/members', {
      method: 'POST',
      body: JSON.stringify(memberData),
    });
  }

  async getMembers(level?: string, page = 1, limit = 10) {
    const query = new URLSearchParams();
    if (level) query.append('level', level);
    query.append('page', page.toString());
    query.append('limit', limit.toString());

    return this.request(`/members?${query.toString()}`);
  }

  async getMember(id: string) {
    return this.request(`/members/${id}`);
  }

  async updateMember(id: string, updateData: any) {
    return this.request(`/members/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
  }

  async addMemberPoints(id: string, pointsData: {
    points: number;
    type: string;
    description?: string;
  }) {
    return this.request(`/members/${id}/points`, {
      method: 'POST',
      body: JSON.stringify(pointsData),
    });
  }

  async getMemberOrderStats(customerId: string) {
    return this.request(`/orders/member/${customerId}/stats`);
  }
}

// 导出单例
export const apiClient = new ApiClient();

// 导出类型
export type { ApiResponse };

// 导出常用的API方法
export const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  login,
  getProfile,
  getUsers,
  getUser,
  createUser,
  updateUser,
} = apiClient;