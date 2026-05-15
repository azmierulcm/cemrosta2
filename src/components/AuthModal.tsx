'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/utils/supabase';

const AuthModal = () => {
  const { isAuthModalOpen, closeAuthModal, authView, setAuthView, setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const isLogin = authView === 'login';

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setUser(data.user);
        closeAuthModal();
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // Supabase usually sends a confirmation email
        setError('Check your email for the confirmation link!');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeAuthModal}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-md rounded-[2.5rem] p-10 relative z-10 shadow-2xl overflow-hidden"
      >
        <button onClick={closeAuthModal} className="absolute top-8 right-8 p-2 hover:bg-gray-100 rounded-full transition-colors">
          <X size={20} className="text-gray-400" />
        </button>

        <div className="mb-10">
          <h2 className="text-3xl font-black text-gray-900 mb-2">
            {isLogin ? 'Welcome back' : 'Join Cemrosta'}
          </h2>
          <p className="text-gray-500 font-medium italic">
            {isLogin ? 'Continue your aviation journey.' : 'The elite crew community awaits.'}
          </p>
        </div>

        {error && (
          <div className={`mb-6 p-4 rounded-2xl flex items-start gap-3 text-sm font-bold border ${
            error.includes('Check your email') ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
          }`}>
            <AlertCircle size={18} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input 
                type="email" 
                placeholder="Aviation Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 pl-14 pr-6 py-5 rounded-2xl font-bold placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-rausch/20 focus:bg-white transition-all text-gray-900"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input 
                type="password" 
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 pl-14 pr-6 py-5 rounded-2xl font-bold placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-rausch/20 focus:bg-white transition-all text-gray-900"
              />
            </div>
          </div>

          <button 
            disabled={isLoading}
            className="w-full bg-rausch text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-rausch/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : isLogin ? 'Login →' : 'Create Account →'}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-gray-50 text-center">
          <p className="text-gray-500 font-medium">
            {isLogin ? "Don't have an account?" : "Already a member?"}
            <button 
              onClick={() => setAuthView(isLogin ? 'signup' : 'login')}
              className="ml-2 text-rausch font-black hover:underline"
            >
              {isLogin ? 'Sign up' : 'Login'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthModal;
