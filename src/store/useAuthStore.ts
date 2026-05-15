import { create } from 'zustand';
import { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  full_name?: string;
  rank?: string;
  airline?: string;
  fleet?: string;
  bio?: string;
  avatar_url?: string;
  gallery_urls?: string[];
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isAuthModalOpen: boolean;
  authView: 'login' | 'signup';
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  openAuthModal: (view?: 'login' | 'signup') => void;
  closeAuthModal: () => void;
  setAuthView: (view: 'login' | 'signup') => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  isAuthModalOpen: false,
  authView: 'signup',
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  openAuthModal: (view = 'signup') => set({ isAuthModalOpen: true, authView: view }),
  closeAuthModal: () => set({ isAuthModalOpen: false }),
  setAuthView: (view) => set({ authView: view }),
}));
