import { create } from 'zustand';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  permissions?: string[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  checkAuth: () => boolean;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  login: (user) => {
    // Sadece memory'de tut, storage'a kaydetme
    set({ user, isAuthenticated: true });
  },
  logout: () => {
    // Memory'den temizle
    set({ user: null, isAuthenticated: false });
  },
  checkAuth: () => {
    // Oturum kontrolü - sadece memory'deki durumu kontrol et
    const state = get();
    return state.isAuthenticated && state.user !== null;
  },
  clearAuth: () => {
    // Tüm oturum verilerini temizle
    set({ user: null, isAuthenticated: false });
  },
}));

// Sayfa yüklendiğinde kesinlikle oturumu temizle
if (typeof window !== 'undefined') {
  // Eski oturum verilerini temizle
  sessionStorage.removeItem('auth-user');
  sessionStorage.removeItem('auth-authenticated');
  localStorage.removeItem('auth-storage');
  localStorage.removeItem('auth-user');
  localStorage.removeItem('auth-authenticated');
  
  // Zustand store'u da temizle
  useAuthStore.getState().clearAuth();
  
  // Debug için log
  console.log('🔒 Oturum temizlendi - Login sayfasına yönlendirilecek');
}

// Kontrol periyotları için enum
type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

// Tesis ve kontrol item tipleri
interface Facility {
  id: string;
  name: string;
}

interface ControlItem {
  id: string;
  title: string;
  description: string;
  facilityId: string;
  user: string;
  workDone: string;
  date: string;
  period: Period;
}

interface ControlState {
  facilities: Facility[];
  controlItems: ControlItem[];
  addControlItem: (item: Omit<ControlItem, 'id'>) => void;
  updateControlItem: (id: string, item: Partial<ControlItem>) => void;
}

export const useControlStore = create<ControlState>((set) => ({
  facilities: [
    { id: '1', name: 'Tesis 1' },
    { id: '2', name: 'Tesis 2' },
  ],
  controlItems: [],
  addControlItem: (item) => set(state => ({
    controlItems: [
      ...state.controlItems,
      { ...item, id: Math.random().toString(36).substr(2, 9) }
    ]
  })),
  updateControlItem: (id, item) => set(state => ({
    controlItems: state.controlItems.map(ci => ci.id === id ? { ...ci, ...item } : ci)
  })),
}));

export type { Period }; 