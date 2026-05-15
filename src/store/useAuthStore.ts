import { create } from 'zustand';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  isAuthModalOpen: boolean;
  authView: 'login' | 'signup';
  setUser: (user: User | null) => void;
  openAuthModal: (view?: 'login' | 'signup') => void;
  closeAuthModal: () => void;
  setAuthView: (view: 'login' | 'signup') => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthModalOpen: false,
  authView: 'signup',
  setUser: (user) => set({ user }),
  openAuthModal: (view = 'signup') => set({ isAuthModalOpen: true, authView: view }),
  closeAuthModal: () => set({ isAuthModalOpen: false }),
  setAuthView: (view) => set({ authView: view }),
}));
