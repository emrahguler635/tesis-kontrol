import QRCode from 'qrcode';

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
  recordNo?: number; // Kayıt numarası
  title: string;
  description?: string;
  period: string;
  frequency?: string; // Backend'de frequency alanı da kullanılıyor
  date: string;
  facility_id?: number;
  work_done?: string;
  user?: string;
  user_name?: string; // Backend'den gelen user_name alanı
  item_name?: string; // Backend'den gelen item_name alanı
  status?: string;
  approval_status?: string; // Onay durumu
  completion_date?: string; // Tamamlanma tarihi
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
  totalCount?: number;
  total_count?: number;
  pulledCount?: number;
  pulled_count?: number;
  account: string;
  sender?: string;
  description: string;
  created_at?: string;
}

class ApiService {
  // Güvenlik seviyesi kontrolü
  private isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  private isProduction = !this.isDevelopment;

  // Güvenli log fonksiyonu
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any) {
    // Development'ta tüm logları göster
    if (this.isDevelopment) {
      console[level](`[${level.toUpperCase()}] ${message}`, data || '');
      return;
    }

    // Production'da sadece önemli logları göster
    if (level === 'error' || level === 'warn') {
      console[level](`[${level.toUpperCase()}] ${message}`, data || '');
    }
    
    // Production'da debug ve info loglarını gizle
    // console.log yerine boş fonksiyon kullan
  }

  // Regular Facility endpoints
  async getFacilities(): Promise<Facility[]> {
    this.log('debug', 'Facilities requested');
    return this.request<Facility[]>('/facilities');
  }

  async createFacility(facility: { name: string; description?: string; status?: string }): Promise<Facility> {
    this.log('info', 'Creating facility', facility);
    return this.request<Facility>('/facilities', {
      method: 'POST',
      body: JSON.stringify(facility),
    });
  }

  async updateFacility(id: number, facility: { name: string; description?: string; status?: string }): Promise<Facility> {
    this.log('info', `Updating facility ${id}`, facility);
    return this.request<Facility>(`/facilities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(facility),
    });
  }

  async deleteFacility(id: number): Promise<any> {
    this.log('warn', `Deleting facility ${id}`);
    return this.request<any>(`/facilities/${id}`, {
      method: 'DELETE',
    });
  }

  // ControlItem endpoints
  async getControlItems(params?: { period?: string; user?: string }): Promise<ControlItem[]> {
    this.log('debug', 'Control items requested', params);
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);
    if (params?.user) queryParams.append('user', params.user);
    
    const queryString = queryParams.toString();
    const url = `/control-items${queryString ? `?${queryString}` : ''}`;
    return this.request<ControlItem[]>(url);
  }

  async createControlItem(item: { title: string; description?: string; period: string; date: string; facilityId?: string; workDone?: string; user?: string; status?: string; completionDate?: string }): Promise<ControlItem> {
    this.log('info', 'Creating control item', item);
    return this.request<ControlItem>('/control-items', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  async updateControlItem(id: number, item: { title: string; description?: string; period: string; date: string; facilityId?: string; workDone?: string; user?: string; status?: string; completionDate?: string }): Promise<ControlItem> {
    this.log('info', `Updating control item ${id}`, item);
    return this.request<ControlItem>(`/control-items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });
  }

  async deleteControlItem(id: number): Promise<any> {
    this.log('warn', `Deleting control item ${id}`);
    return this.request<any>(`/control-items/${id}`, {
      method: 'DELETE',
    });
  }

  async moveControlItems(params: { 
    sourcePeriod: string; 
    targetPeriod: string; 
    startDate?: string; 
    endDate?: string; 
  }): Promise<{ message: string; movedCount: number }> {
    this.log('info', 'Moving control items', params);
    return this.request<{ message: string; movedCount: number }>('/control-items/move', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getPendingApprovals(user?: string): Promise<ControlItem[]> {
    this.log('debug', 'Pending approvals requested', { user });
    return this.request<ControlItem[]>(`/control-items/pending-approvals${user ? `?user=${user}` : ''}`);
  }

  async approveControlItem(id: number, approvedBy: string): Promise<any> {
    this.log('info', `Approving control item ${id}`, { approvedBy });
    return this.request<any>(`/control-items/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approvedBy }),
    });
  }

  async rejectControlItem(id: number, rejectedBy: string, reason: string): Promise<any> {
    this.log('warn', `Rejecting control item ${id}`, { rejectedBy, reason });
    return this.request<any>(`/control-items/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejectedBy, reason }),
    });
  }

  // User endpoints
  async getUsers(): Promise<User[]> {
    this.log('debug', 'Users requested');
    return this.request<User[]>('/users');
  }

  async createUser(user: { username: string; email: string; password: string; role: string; permissions?: string[] }): Promise<User> {
    this.log('info', 'Creating user', { ...user, password: '***' });
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  }

  async updateUser(id: number, user: { username: string; email: string; password?: string; role: string; permissions?: string[] }): Promise<User> {
    this.log('info', `Updating user ${id}`, { ...user, password: user.password ? '***' : undefined });
    return this.request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    });
  }

  async deleteUser(id: number): Promise<any> {
    this.log('warn', `Deleting user ${id}`);
    return this.request<any>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Message endpoints
  async getMessages(): Promise<Message[]> {
    this.log('debug', 'Messages requested');
    return this.request<Message[]>('/messages');
  }

  async createMessage(message: { date: string; totalCount: number; pulledCount: number; account: string; sender?: string; description: string }): Promise<Message> {
    this.log('info', 'Creating message', message);
    return this.request<Message>('/messages', {
      method: 'POST',
      body: JSON.stringify(message),
    });
  }

  async updateMessage(id: number, message: { date: string; totalCount: number; pulledCount: number; account: string; sender?: string; description: string }): Promise<Message> {
    this.log('info', `Updating message ${id}`, message);
    return this.request<Message>(`/messages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(message),
    });
  }

  async deleteMessage(id: number): Promise<any> {
    this.log('warn', `Deleting message ${id}`);
    return this.request<any>(`/messages/${id}`, {
      method: 'DELETE',
    });
  }

  async getMessageStats(): Promise<{
    totalMessages: number;
    totalCount: number;
    pulledCount: number;
    successRate: number;
    messageLog: number;
  }> {
    this.log('debug', 'Message stats requested');
    return this.request<{
      totalMessages: number;
      totalCount: number;
      pulledCount: number;
      successRate: number;
      messageLog: number;
    }>('/messages/stats');
  }

  // BagTV endpoints
  async getBagTVFacilities(): Promise<any[]> {
    this.log('debug', 'BagTV facilities requested');
    return this.request<any[]>('/bagtv-facilities');
  }

  async createBagTVFacility(facility: { name: string; tvCount: number; description: string; status: string }): Promise<any> {
    this.log('info', 'Creating BagTV facility', facility);
    return this.request<any>('/bagtv-facilities', {
      method: 'POST',
      body: JSON.stringify(facility),
    });
  }

  async updateBagTVFacility(id: string, facility: { name: string; tvCount: number; description: string; status: string }): Promise<any> {
    this.log('info', `Updating BagTV facility ${id}`, facility);
    return this.request<any>(`/bagtv-facilities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(facility),
    });
  }

  async deleteBagTVFacility(id: string): Promise<any> {
    this.log('warn', `Deleting BagTV facility ${id}`);
    return this.request<any>(`/bagtv-facilities/${id}`, {
      method: 'DELETE',
    });
  }

  async getBagTVControls(facilityId?: string): Promise<any[]> {
    this.log('debug', 'BagTV controls requested', { facilityId });
    return this.request<any[]>(`/bagtv-controls${facilityId ? `?facilityId=${facilityId}` : ''}`);
  }

  async createBagTVControl(control: { facilityId: string; date: string; action: string; description?: string; checkedBy: string }): Promise<any> {
    this.log('info', 'Creating BagTV control', control);
    return this.request<any>('/bagtv-controls', {
      method: 'POST',
      body: JSON.stringify(control),
    });
  }

  async deleteBagTVControl(id: string): Promise<any> {
    this.log('warn', `Deleting BagTV control ${id}`);
    return this.request<any>(`/bagtv-controls/${id}`, {
      method: 'DELETE',
    });
  }

  // YBS Work Program endpoints
  async getYBSWorkItems(): Promise<any[]> {
    this.log('debug', 'YBS work items requested');
    return this.request<any[]>('/ybs-work-items');
  }

  async createYBSWorkItem(item: {
    title: string;
    description: string;
    requestDate: string;
    completionDate?: string;
    requestingDepartment: string;
    responsibleUsers: string[];
    jiraNumber?: string;
    status: string;
    approvalStatus: string;
    createdBy: string;
  }): Promise<any> {
    this.log('info', 'Creating YBS work item', item);
    return this.request<any>('/ybs-work-items', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  async updateYBSWorkItem(id: number, item: {
    title: string;
    description: string;
    requestDate: string;
    completionDate?: string;
    requestingDepartment: string;
    responsibleUsers: string[];
    jiraNumber?: string;
    status: string;
    approvalStatus: string;
  }): Promise<any> {
    this.log('info', `Updating YBS work item ${id}`, item);
    return this.request<any>(`/ybs-work-items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });
  }

  async deleteYBSWorkItem(id: number): Promise<any> {
    this.log('info', `Deleting YBS work item ${id}`);
    return this.request<any>(`/ybs-work-items/${id}`, {
      method: 'DELETE',
    });
  }

  async updateYBSWorkItemApproval(id: number, approval: {
    approvalStatus: string;
    approvedBy: string;
    approvedAt: string;
  }): Promise<any> {
    this.log('info', `Updating YBS work item approval ${id}`, approval);
    return this.request<any>(`/ybs-work-items/${id}/approval`, {
      method: 'PUT',
      body: JSON.stringify(approval),
    });
  }

  // Authentication
  async login(credentials: { username: string; password: string }): Promise<any> {
    this.log('info', 'Login attempt', { username: credentials.username, password: '***' });
    return this.request<any>('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  // WhatsApp endpoints
  async getWhatsAppStatus(): Promise<any> {
    this.log('debug', 'WhatsApp status requested');
    return this.request<any>('/whatsapp/status');
  }

  async generateWhatsAppQR(): Promise<any> {
    this.log('info', 'WhatsApp QR generation requested');
    return this.request<any>('/whatsapp/qr', {
      method: 'POST',
    });
  }

  async disconnectWhatsApp(): Promise<any> {
    this.log('warn', 'WhatsApp disconnect requested');
    return this.request<any>('/whatsapp/disconnect', {
      method: 'POST',
    });
  }

  async sendWhatsAppMessage(phoneNumber: string, message: string): Promise<any> {
    this.log('info', 'WhatsApp message sending', { phoneNumber, message: message.substring(0, 50) + '...' });
    return this.request<any>('/whatsapp/send', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, message }),
    });
  }

  async sendWhatsAppBulkMessage(phoneNumbers: string[], message: string): Promise<any> {
    this.log('info', 'WhatsApp bulk message sending', { 
      phoneCount: phoneNumbers.length, 
      message: message.substring(0, 50) + '...' 
    });
    return this.request<any>('/whatsapp/send-bulk', {
      method: 'POST',
      body: JSON.stringify({ phoneNumbers, message }),
    });
  }

  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    // Production'da mock API kullan, development'ta gerçek API kullan
    const baseUrl = this.isDevelopment ? 'http://localhost:3001' : '';
    const url = `${baseUrl}/api${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    
    this.log('debug', `API Request: ${options?.method || 'GET'} ${url}`);
    
    // Development'ta gerçek API kullan
    if (this.isDevelopment) {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });
  
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        this.log('error', `API Error: ${response.status}`, error);
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      this.log('debug', `API Response: ${options?.method || 'GET'} ${url}`, data);
      return data;
    }
    
    // Production'da mock API kullan
    if (endpoint.includes('/whatsapp/')) {
      return this.mockWhatsAppAPI(endpoint, options);
    }
    
    // YBS endpoint'leri için gerçek API kullan (hem development hem production'da)
    if (endpoint.includes('/ybs-work-items')) {
      return this.realYBSAPI(endpoint, options);
    }
    
    // BağTV kontrolleri için gerçek API kullan (development ve production'da)
    if (endpoint.includes('/bagtv-controls')) {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });
  
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        this.log('error', `API Error: ${response.status}`, error);
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      this.log('debug', `API Response: ${options?.method || 'GET'} ${url}`, data);
      return data;
    }
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
  
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      this.log('error', `API Error: ${response.status}`, error);
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }
  
    const data = await response.json();
    this.log('debug', `API Response: ${options?.method || 'GET'} ${url}`, data);
    return data;
  }
 
  // Mock BagTV Controls API
  async mockBagTVControlsAPI(endpoint: string, options?: RequestInit): Promise<any> {
    this.log('debug', `Mock BagTV Controls API: ${endpoint}`, options);
    
    // Simüle edilmiş gecikme
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock data - Global olarak sakla
    if (!(window as any).mockBagTVControls) {
      (window as any).mockBagTVControls = [
        {
          _id: '1',
          facilityId: '1',
          date: '2025-08-05',
          action: 'Sistem kontrolü yapıldı',
          description: 'Tüm TV sistemleri kontrol edildi ve çalışır durumda',
          checkedBy: 'emrah',
          createdAt: new Date()
        },
        {
          _id: '2',
          facilityId: '2',
          date: '2025-08-04',
          action: 'Bakım yapıldı',
          description: 'TV sistemlerinde rutin bakım yapıldı',
          checkedBy: 'admin',
          createdAt: new Date()
        }
      ];
    }
    
    const mockBagTVControls = (window as any).mockBagTVControls;
    
    if (endpoint === '/bagtv-controls' && options?.method === 'GET') {
      // Query parametrelerini parse et
      const urlParams = new URLSearchParams(endpoint.includes('?') ? endpoint.split('?')[1] : '');
      const facilityId = urlParams.get('facilityId');
      
      this.log('debug', `GET request - facilityId: ${facilityId}`);
      
      if (facilityId) {
        // Sadece belirli tesis için kontrolleri filtrele
        const facilityControls = mockBagTVControls.filter((control: any) => {
          this.log('debug', `Comparing control.facilityId (${control.facilityId}) with requested facilityId (${facilityId})`);
          return control.facilityId === facilityId;
        });
        this.log('debug', `Filtered controls for facility ${facilityId}:`, facilityControls);
        return facilityControls;
      } else {
        this.log('debug', 'Returning all controls:', mockBagTVControls);
        return mockBagTVControls;
      }
    }
    
    if (endpoint === '/bagtv-controls' && options?.method === 'POST') {
      const body = JSON.parse(options.body as string);
      this.log('debug', 'POST request body:', body);
      
      const newControl = {
        _id: Date.now().toString(),
        ...body,
        createdAt: new Date()
      };
      
      mockBagTVControls.push(newControl);
      this.log('debug', 'Added new control:', newControl);
      this.log('debug', 'Updated controls list:', mockBagTVControls);
      
      return newControl;
    }
    
    if (endpoint.includes('/bagtv-controls/') && options?.method === 'DELETE') {
      const id = endpoint.split('/').pop();
      const index = mockBagTVControls.findIndex((control: any) => control._id === id);
      
      if (index !== -1) {
        mockBagTVControls.splice(index, 1);
        return { message: 'Control deleted successfully' };
      } else {
        throw new Error('Control not found');
      }
    }
    
    return mockBagTVControls;
  }

  // Gerçek YBS API
  async realYBSAPI(endpoint: string, options?: RequestInit): Promise<any> {
    this.log('debug', `Real YBS API: ${endpoint}`, options);
    
    // Gerçek API endpoint'ine istek at
    const apiUrl = this.isDevelopment 
      ? `http://localhost:3001/api${endpoint}`
      : `https://backend-bskpouo60-emrahs-projects-7d7ccaf2.vercel.app/api${endpoint}`;
    
    const response = await fetch(apiUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`YBS API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Mock YBS API (yedek olarak)
  async mockYBSAPI(endpoint: string, options?: RequestInit): Promise<any> {
    this.log('debug', `Mock YBS API: ${endpoint}`, options);
    
    // Simüle edilmiş gecikme
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Local Storage'dan veri yükle veya varsayılan verileri kullan
    const loadYBSData = (): any[] => {
      const stored = localStorage.getItem('ybs_work_items');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (error) {
          console.error('Local storage parse error:', error);
        }
      }
      
      // Varsayılan veriler (Neon'daki gerçek veriler)
      const defaultData = [
        {
          id: 1,
          title: 'tyest',
          description: 'test',
          requestDate: '2025-08-05',
          completionDate: '2025-08-05',
          requestingDepartment: 'bilgi işlem',
          responsibleUsers: ['emrah2', 'Ferhat'],
          jiraNumber: '',
          status: 'pending',
          approvalStatus: 'pending',
          createdBy: 'admin',
          createdAt: '2025-08-05T10:00:00Z',
          updatedAt: '2025-08-05T15:30:00Z'
        },
        {
          id: 2,
          title: '52',
          description: 'aaaaa',
          requestDate: '2025-08-05',
          completionDate: null,
          requestingDepartment: 'özel',
          responsibleUsers: ['emrah2', 'Ferhat'],
          jiraNumber: '',
          status: 'pending',
          approvalStatus: 'pending',
          createdBy: 'admin',
          createdAt: '2025-08-05T09:00:00Z',
          updatedAt: '2025-08-05T14:20:00Z'
        },
        {
          id: 3,
          title: '28',
          description: 'aaaaaaaa',
          requestDate: '2025-08-05',
          completionDate: null,
          requestingDepartment: 'çevre',
          responsibleUsers: ['emrah2', 'emrah1'],
          jiraNumber: '',
          status: 'pending',
          approvalStatus: 'pending',
          createdBy: 'admin',
          createdAt: '2025-08-05T11:30:00Z',
          updatedAt: '2025-08-05T11:30:00Z'
        }
      ];
      
      return defaultData;
    };
    
    // Local Storage'a kaydet
    const saveYBSData = (data: any[]): void => {
      try {
        localStorage.setItem('ybs_work_items', JSON.stringify(data));
      } catch (error) {
        console.error('Local storage save error:', error);
      }
    };
    
    // Veriyi yükle
    let mockData = loadYBSData();
    
    if (endpoint === '/ybs-work-items' && (!options || options.method === 'GET')) {
      return mockData;
    }
    
    if (endpoint === '/ybs-work-items' && options?.method === 'POST') {
      const newItem = JSON.parse(options.body as string);
      const id = Math.max(...mockData.map((item: any) => item.id)) + 1;
      const item = {
        id,
        ...newItem,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockData.push(item);
      saveYBSData(mockData); // Local Storage'a kaydet
      return item;
    }
    
    if (endpoint.startsWith('/ybs-work-items/') && options?.method === 'PUT') {
      const id = parseInt(endpoint.split('/').pop()!);
      const updateData = JSON.parse(options.body as string);
      const itemIndex = mockData.findIndex((item: any) => item.id === id);
      
      if (itemIndex === -1) {
        throw new Error('YBS işi bulunamadı');
      }
      
      mockData[itemIndex] = {
        ...mockData[itemIndex],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      
      saveYBSData(mockData); // Local Storage'a kaydet
      return mockData[itemIndex];
    }
    
    if (endpoint.startsWith('/ybs-work-items/') && options?.method === 'DELETE') {
      const id = parseInt(endpoint.split('/').pop()!);
      const itemIndex = mockData.findIndex((item: any) => item.id === id);
      
      if (itemIndex === -1) {
        throw new Error('YBS işi bulunamadı');
      }
      
      mockData.splice(itemIndex, 1);
      saveYBSData(mockData); // Local Storage'a kaydet
      return { message: 'YBS işi silindi' };
    }
    
    throw new Error(`Unknown YBS endpoint: ${endpoint}`);
  }

  // Mock WhatsApp API
  async mockWhatsAppAPI(endpoint: string, options?: RequestInit): Promise<any> {
    this.log('debug', `Mock WhatsApp API: ${endpoint}`, options);
    
    // Simüle edilmiş gecikme
    await new Promise(resolve => setTimeout(resolve, 1000));
  
    if (endpoint === '/whatsapp/status') {
      this.log('debug', 'Mock WhatsApp status response');
      return {
        success: true,
        data: {
          isConnected: false,
          connectionStatus: 'Bağlantı yok',
          qrCode: null,
          phoneNumber: null,
          lastSeen: null
        }
      };
    }
  
    if (endpoint === '/whatsapp/qr' && options?.method === 'POST') {
      try {
        this.log('info', 'Generating mock WhatsApp QR code');
        // Gerçek WhatsApp Web QR kodu oluştur
        const qrData = '2@Yj8EjW6JWLpWrtP1tRdxgCEmuugn/GP9kPIgLzqOsanC3uJaY5Ag3E=@VjEefF+2jN0KYBZqAbh5g1==';
        const qrCodeDataURL = await QRCode.toDataURL(qrData, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'H'
        });
        
        this.log('debug', 'Mock WhatsApp QR code generated successfully');
        return {
          success: true,
          data: {
            qrCode: qrCodeDataURL,
            message: 'WhatsApp Web QR kod oluşturuldu'
          }
        };
      } catch (error) {
        this.log('error', 'Mock WhatsApp QR code generation failed', error);
        return {
          success: false,
          error: 'QR kod oluşturulamadı'
        };
      }
    }
  
    if (endpoint === '/whatsapp/disconnect' && options?.method === 'POST') {
      this.log('info', 'Mock WhatsApp disconnect');
      return {
        success: true,
        data: {
          message: 'Mock bağlantı kesildi'
        }
      };
    }
  
    if (endpoint === '/whatsapp/send' && options?.method === 'POST') {
      try {
        const body = JSON.parse(options.body as string);
        this.log('info', 'Mock WhatsApp message sending', { 
          phoneNumber: body.phoneNumber, 
          messageLength: body.message?.length || 0 
        });
        
        // Simüle edilmiş başarı
        return {
          success: true,
          data: {
            messageId: `mock_${Date.now()}`,
            status: 'sent',
            timestamp: new Date().toISOString()
          }
        };
      } catch (error) {
        this.log('error', 'Mock WhatsApp message sending failed', error);
        return {
          success: false,
          error: 'Mesaj gönderilemedi'
        };
      }
    }
  
    if (endpoint === '/whatsapp/send-bulk' && options?.method === 'POST') {
      try {
        const body = JSON.parse(options.body as string);
        this.log('info', 'Mock WhatsApp bulk message sending', { 
          phoneCount: body.phoneNumbers?.length || 0,
          messageLength: body.message?.length || 0 
        });
        
        // Simüle edilmiş toplu mesaj sonucu
        const results = body.phoneNumbers?.map((phone: string) => ({
          phoneNumber: phone,
          status: 'sent',
          messageId: `mock_bulk_${Date.now()}_${Math.random()}`
        })) || [];
        
        return {
          success: true,
          data: {
            totalSent: results.length,
            results: results,
            timestamp: new Date().toISOString()
          }
        };
      } catch (error) {
        this.log('error', 'Mock WhatsApp bulk message sending failed', error);
        return {
          success: false,
          error: 'Toplu mesaj gönderilemedi'
        };
      }
    }
  
    this.log('warn', `Unknown mock WhatsApp endpoint: ${endpoint}`);
    return {
      success: false,
      error: 'Bilinmeyen endpoint'
    };
  }
}

const apiService = new ApiService();
export { apiService }; 