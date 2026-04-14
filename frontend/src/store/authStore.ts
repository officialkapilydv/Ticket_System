import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  isAdmin: () => boolean;
  isAgent: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,

      setAuth: (user, token) => {
        localStorage.setItem('auth_token', token);
        set({ user, token });
      },

      setUser: (user) => set({ user }),

      logout: () => {
        localStorage.removeItem('auth_token');
        set({ user: null, token: null });
      },

      isAdmin: () => get().user?.role === 'admin',
      isAgent: () => ['admin', 'agent'].includes(get().user?.role ?? ''),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
