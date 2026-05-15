'use client';

import React, { useState } from 'react';
import { User, Menu, X, Upload, LayoutDashboard, Calendar, MapPinned, ShoppingBag, Settings as SettingsIcon } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { supabase } from '@/lib/utils/supabase';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

const Navbar = () => {
  const { user, setUser, openAuthModal } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const scrollToTop = () => {
    if (pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navLinks = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard, authRequired: true },
    { label: 'Calendar', href: '/calendar', icon: Calendar, authRequired: true },
    { label: 'Passport', href: '/profile', icon: MapPinned, authRequired: true },
    { label: 'Marketplace', href: '/marketplace', icon: ShoppingBag, authRequired: true },
    { label: 'Settings', href: '/settings', icon: SettingsIcon, authRequired: true },
  ];

  return (
    <nav className="fixed top-0 w-full bg-bg/80 backdrop-blur-md border-b border-border z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link 
            href="/" 
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            onClick={scrollToTop}
          >
            {/* Abstract Runway Logo */}
            <div className="flex flex-col gap-1">
              <div className="w-6 h-1.5 bg-accent/30" />
              <div className="w-6 h-3 bg-accent/60" />
              <div className="w-6 h-6 bg-accent" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-text">Cemrosta</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4 font-medium text-sm text-text-muted">
            {user ? (
              <>
                <div className="flex items-center gap-2 mr-4">
                  {navLinks.map((link) => (
                    <Link 
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${pathname === link.href ? 'text-accent bg-accent/10' : 'hover:text-text hover:bg-surface'}`}
                    >
                      <link.icon size={18} />
                      {link.label}
                    </Link>
                  ))}
                </div>
                <button 
                  onClick={handleSignOut}
                  className="bg-surface text-text border border-border px-6 py-2.5 rounded-xl hover:bg-surface-2 transition-all active:scale-95 font-bold"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => openAuthModal('login')}
                  className="text-text-muted hover:text-text px-4 py-2.5 transition-colors font-bold"
                >
                  Sign In
                </button>
                <button 
                  onClick={scrollToTop}
                  className="bg-accent text-accent-fg px-6 py-2.5 rounded-xl hover:bg-accent-hover transition-all active:scale-95 shadow-lg shadow-accent/20 font-bold flex items-center gap-2"
                >
                  <Upload size={16} strokeWidth={3} />
                  Upload Roster
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-text-muted hover:text-text transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-20 left-0 w-full bg-bg border-b border-border md:hidden p-4 space-y-4"
          >
            {user ? (
              <>
                <div className="grid grid-cols-1 gap-2">
                  {navLinks.map((link) => (
                    <Link 
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-4 rounded-2xl font-bold ${pathname === link.href ? 'text-accent bg-accent/10' : 'text-text bg-surface'}`}
                    >
                      <link.icon size={20} />
                      {link.label}
                    </Link>
                  ))}
                </div>
                <button 
                  onClick={() => {
                    handleSignOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-4 text-text-muted font-bold text-left"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => {
                    scrollToTop();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-4 text-accent-fg font-bold bg-accent rounded-2xl"
                >
                  <Upload size={20} strokeWidth={3} />
                  Upload Roster
                </button>
                <button 
                  onClick={() => {
                    openAuthModal('login');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-4 text-text font-bold text-left"
                >
                  Sign In
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
