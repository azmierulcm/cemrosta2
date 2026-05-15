'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/utils/supabase';

const AuthModal = () => {
  const { isAuthModalOpen, closeAuthModal, setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  if (!isAuthModalOpen) return null;

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        }
      });
      
      if (error) throw error;
      
      setMessage({ 
        type: 'success', 
        text: 'Check your inbox! We\'ve sent a magic login link to your aviation email.' 
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
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
        className="bg-white w-full max-w-md rounded-[2.5rem] p-10 relative z-10 shadow-2xl overflow-hidden text-center"
      >
        <button onClick={closeAuthModal} className="absolute top-8 right-8 p-2 hover:bg-gray-100 rounded-full transition-colors">
          <X size={20} className="text-gray-400" />
        </button>

        <div className="w-20 h-20 bg-rausch/10 rounded-full flex items-center justify-center mx-auto mb-8">
           <Sparkles className="text-rausch w-10 h-10" />
        </div>

        <div className="mb-10">
          <h2 className="text-3xl font-black text-gray-900 mb-2">Zero Friction.</h2>
          <p className="text-gray-500 font-medium italic">
            Sign in with a Magic Link. No passwords required.
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-5 rounded-2xl flex items-start gap-3 text-sm font-bold border ${
            message.type === 'success' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
          }`}>
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p className="text-left leading-relaxed">{message.text}</p>
          </div>
        )}

        <form onSubmit={handleMagicLink} className="space-y-6">
          <div className="relative">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input 
              type="email" 
              placeholder="Your Aviation Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 pl-14 pr-6 py-5 rounded-2xl font-bold placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-rausch/20 focus:bg-white transition-all text-gray-900"
            />
          </div>

          <button 
            disabled={isLoading || message?.type === 'success'}
            className="w-full bg-black text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-gray-800 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : 'Send Magic Link →'}
          </button>
        </form>

        <p className="mt-8 text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
          Secure, passwordless authentication <br />
          powered by Supabase
        </p>
      </motion.div>
    </div>
  );
};

export default AuthModal;
