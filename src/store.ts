import { create } from 'zustand';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  permissions?: string[];
  profileImage?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loginTime: number | null;
  sessionTimeout: number; // 30 dakika (milisaniye)
  login: (user: User) => void;
  logout: () => void;
  checkAuth: () => boolean;
  clearAuth: () => void;
  checkSessionTimeout: () => boolean;
  resetSessionTimer: () => void;
  updateUser: (updatedUser: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  loginTime: null,
  sessionTimeout: (() => {
    // localStorage'dan oturum süresini oku
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sessionDuration');
      if (saved) {
        return parseInt(saved) * 60 * 1000; // Dakikayı milisaniyeye çevir
      }
    }
    return 30 * 60 * 1000; // Varsayılan 30 dakika
  })(),
  login: (user) => {
    // Sadece memory'de tut, storage'a kaydetme
    set({ user, isAuthenticated: true, loginTime: Date.now() });
  },
  logout: () => {
    // Memory'den temizle
    set({ user: null, isAuthenticated: false, loginTime: null });
  },
  checkAuth: () => {
    // Oturum kontrolü - sadece memory'deki durumu kontrol et
    const state = get();
    return state.isAuthenticated && state.user !== null;
  },
  clearAuth: () => {
    // Tüm oturum verilerini temizle
    set({ user: null, isAuthenticated: false, loginTime: null });
  },
  checkSessionTimeout: () => {
    const state = get();
    if (!state.isAuthenticated || !state.loginTime) return false;
    
    // Session timeout değerini dinamik olarak al
    const currentSessionTimeout = (() => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('sessionDuration');
        if (saved) {
          return parseInt(saved) * 60 * 1000;
        }
      }
      return 30 * 60 * 1000;
    })();
    
    const currentTime = Date.now();
    const timeDiff = currentTime - state.loginTime;
    
    // Oturum süresi dolmuş mu kontrol et
    if (timeDiff > currentSessionTimeout) {
      console.log('⏰ Oturum süresi doldu - Otomatik çıkış yapılıyor');
      state.logout();
      return true; // Süre doldu
    }
    
    return false; // Süre dolmadı
  },
  resetSessionTimer: () => {
    // Kullanıcı aktivitesi olduğunda süreyi sıfırla
    const state = get();
    if (state.isAuthenticated) {
      set({ loginTime: Date.now() });
      // Sadece development'ta log at
      if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        console.log('🔄 Oturum süresi sıfırlandı');
      }
    }
  },
  updateUser: (updatedUser) => {
    const state = get();
    if (state.user) {
      const newUser = { ...state.user, ...updatedUser };
      set({ user: newUser });
      console.log('🔍 Store user updated:', newUser);
    }
  },
}));

// Oturum süresi kontrolü için interval
let sessionCheckInterval: number | null = null;

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
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    console.log('🔒 Oturum temizlendi - Login sayfasına yönlendirilecek');
  }
  
  // Oturum süresi kontrolü için interval başlat
  sessionCheckInterval = setInterval(() => {
    const store = useAuthStore.getState();
    if (store.checkSessionTimeout()) {
      // Oturum süresi doldu, kullanıcıyı login sayfasına yönlendir
      window.location.href = '/login';
    }
  }, 60000); // Her dakika kontrol et
  
  // Kullanıcı aktivitesi olduğunda süreyi sıfırla
  const resetTimer = () => {
    useAuthStore.getState().resetSessionTimer();
  };
  
  // Mouse hareketi, klavye tuşu, scroll gibi aktiviteleri dinle
  window.addEventListener('mousemove', resetTimer);
  window.addEventListener('keydown', resetTimer);
  window.addEventListener('scroll', resetTimer);
  window.addEventListener('click', resetTimer);
  
  // Sayfa kapatıldığında interval'i temizle
  window.addEventListener('beforeunload', () => {
    if (sessionCheckInterval) {
      clearInterval(sessionCheckInterval);
    }
  });
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