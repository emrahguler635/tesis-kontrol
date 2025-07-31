// Facility type definition
export interface Facility {
  id: number;
  name: string;
  description?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

// ControlItem type definition
export interface ControlItem {
  id: number;
  title: string;
  description?: string;
  period: string;
  frequency?: string; // Backend'de frequency alanı da kullanılıyor
  date: string;
  facility_id?: number;
  work_done?: string;
  user?: string;
  status?: string;
  created_at?: string;
}

// User type definition
export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  permissions?: string[];
  created_at?: string;
}

// Message type definition
export interface Message {
  id: number;
  date: string;
  totalCount: number;
  pulledCount: number;
  account: string;
  sender?: string;
  description: string;
  created_at?: string;
}

class ApiService {
  // Regular Facility endpoints
  async getFacilities(): Promise<Facility[]> {
    return this.request<Facility[]>('/facilities');
  }

  async createFacility(facility: { name: string; description?: string; status?: string }): Promise<Facility> {
    return this.request<Facility>('/facilities', {
      method: 'POST',
      body: JSON.stringify(facility),
    });
  }

  async updateFacility(id: number, facility: { name: string; description?: string; status?: string }): Promise<Facility> {
    return this.request<Facility>(`/facilities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(facility),
    });
  }

  async deleteFacility(id: number): Promise<any> {
    return this.request<any>(`/facilities/${id}`, {
      method: 'DELETE',
    });
  }

  // ControlItem endpoints
  async getControlItems(params?: { period?: string }): Promise<ControlItem[]> {
    const queryParams = params?.period ? `?period=${params.period}` : '';
    return this.request<ControlItem[]>(`/control-items${queryParams}`);
  }

  async createControlItem(item: { title: string; description?: string; period: string; date: string; facilityId?: string; workDone?: string; user?: string; status?: string }): Promise<ControlItem> {
    return this.request<ControlItem>('/control-items', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  async updateControlItem(id: number, item: { title: string; description?: string; period: string; date: string; facilityId?: string; workDone?: string; user?: string; status?: string }): Promise<ControlItem> {
    return this.request<ControlItem>(`/control-items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });
  }

  async deleteControlItem(id: number): Promise<any> {
    return this.request<any>(`/control-items/${id}`, {
      method: 'DELETE',
    });
  }

  // ControlItem taşıma (bir periyottan diğerine)
  async moveControlItems(params: { 
    sourcePeriod: string; 
    targetPeriod: string; 
    startDate?: string; 
    endDate?: string; 
  }): Promise<{ message: string; movedCount: number }> {
    return this.request<{ message: string; movedCount: number }>('/control-items/move', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getPendingApprovals(): Promise<ControlItem[]> {
    return this.request<ControlItem[]>('/control-items/pending-approvals');
  }

  async approveControlItem(id: number, approvedBy: string): Promise<any> {
    return this.request<any>(`/control-items/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approvedBy }),
    });
  }

  async rejectControlItem(id: number, rejectedBy: string, reason: string): Promise<any> {
    return this.request<any>(`/control-items/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejectedBy, reason }),
    });
  }

  // User endpoints
  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/users');
  }

  async createUser(user: { username: string; email: string; password: string; role: string; permissions?: string[] }): Promise<User> {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  }

  async updateUser(id: number, user: { username: string; email: string; password?: string; role: string; permissions?: string[] }): Promise<User> {
    return this.request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    });
  }

  async deleteUser(id: number): Promise<any> {
    return this.request<any>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Message endpoints
  async getMessages(): Promise<Message[]> {
    return this.request<Message[]>('/messages');
  }

  async createMessage(message: { date: string; totalCount: number; pulledCount: number; account: string; sender?: string; description: string }): Promise<Message> {
    return this.request<Message>('/messages', {
      method: 'POST',
      body: JSON.stringify(message),
    });
  }

  async updateMessage(id: number, message: { date: string; totalCount: number; pulledCount: number; account: string; sender?: string; description: string }): Promise<Message> {
    return this.request<Message>(`/messages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(message),
    });
  }

  async deleteMessage(id: number): Promise<any> {
    return this.request<any>(`/messages/${id}`, {
      method: 'DELETE',
    });
  }

  // BağTV Facility endpoints
  async getBagTVFacilities(): Promise<any[]> {
    return this.request<any[]>('/bagtv-facilities');
  }

  async createBagTVFacility(facility: { name: string; tvCount: number; description: string; status: string }): Promise<any> {
    return this.request<any>('/bagtv-facilities', {
      method: 'POST',
      body: JSON.stringify({
        name: facility.name,
        tv_count: facility.tvCount,
        description: facility.description,
        status: facility.status
      }),
    });
  }

  async updateBagTVFacility(id: string, facility: { name: string; tvCount: number; description: string; status: string }): Promise<any> {
    return this.request<any>(`/bagtv-facilities/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: facility.name,
        tv_count: facility.tvCount,
        description: facility.description,
        status: facility.status
      }),
    });
  }

  async deleteBagTVFacility(id: string): Promise<any> {
    return this.request<any>(`/bagtv-facilities/${id}`, {
      method: 'DELETE',
    });
  }

  // BagTV Kontrol Kayıtları
  async getBagTVControls(facilityId?: string): Promise<any[]> {
    const endpoint = facilityId ? `/bagtv-controls?facilityId=${facilityId}` : '/bagtv-controls';
    return this.request<any[]>(endpoint);
  }

  async createBagTVControl(control: { facilityId: string; date: string; action: string; description?: string; checkedBy: string }): Promise<any> {
    return this.request<any>('/bagtv-controls', {
      method: 'POST',
      body: JSON.stringify(control),
    });
  }

  async deleteBagTVControl(id: string): Promise<any> {
    return this.request<any>(`/bagtv-controls/${id}`, {
      method: 'DELETE',
    });
  }

  // Gerçek HTTP isteklerini yapan request fonksiyonu
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    // Yerel geliştirme için localhost:3001 kullan
    const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:3001' : '';
    const url = `${baseUrl}/api${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}

const apiService = new ApiService();
export { apiService }; 