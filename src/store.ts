import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

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