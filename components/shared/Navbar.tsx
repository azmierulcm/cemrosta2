'use client'

import React, { useState, useEffect } from 'react'
import { Menu, X, LayoutDashboard, MapPinned, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/contexts/AuthContext'
import { AnimatePresence, motion } from 'framer-motion'
import { usePathname } from 'next/navigation'

export const Navbar = () => {
  const { user, signOutUser, openAuthModal } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  // Close mobile menu on Escape
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsMobileMenuOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isMobileMenuOpen]);

  const navLinks = [
    { label: 'Timeline', href: '/', icon: LayoutDashboard },
    { label: 'Passport', href: '/profile', icon: MapPinned },
    { label: 'Marketplace', href: '/marketplace', icon: ShoppingBag },
  ]

  return (
    <nav className="sticky top-0 w-full bg-bg border-b border-border z-[100]" style={{ borderBottomWidth: '0.5px' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Wordmark */}
          <Link
            href="/"
            className="text-[22px] font-semibold text-text tracking-tight hover:opacity-75 transition-opacity"
          >
            Cemrosta
          </Link>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-[var(--radius-pill)] text-[14px] font-medium transition-colors ${
                      pathname === link.href
                        ? 'text-accent bg-accent-soft'
                        : 'text-text-muted hover:text-text hover:bg-surface'
                    }`}
                  >
                    <link.icon size={16} />
                    {link.label}
                  </Link>
                ))}
                <button
                  onClick={signOutUser}
                  className="ml-2 px-4 py-2 rounded-[var(--radius-pill)] text-[14px] text-text-muted hover:text-text hover:bg-surface transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-4 py-2 rounded-[var(--radius-pill)] text-[14px] text-text hover:bg-surface transition-colors"
                >
                  Sign in
                </button>
                <button
                  onClick={() => openAuthModal('signup')}
                  className="flex items-center gap-2 px-5 py-2 rounded-[var(--radius-pill)] bg-accent text-accent-fg text-[14px] font-medium hover:bg-accent-hover transition-colors shadow-[var(--shadow-sm)]"
                >
                  Register
                </button>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-text-muted hover:text-text transition-colors"
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-nav"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: 'spring', stiffness: 200, damping: 24 }}
            id="mobile-nav"
            className="absolute top-16 left-0 w-full bg-bg border-b border-border md:hidden p-4 space-y-2 shadow-[var(--shadow-md)]"
          >
            {user ? (
              <>
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-[var(--radius-lg)] text-[15px] font-medium ${
                      pathname === link.href
                        ? 'text-accent bg-accent-soft'
                        : 'text-text hover:bg-surface'
                    }`}
                  >
                    <link.icon size={18} />
                    {link.label}
                  </Link>
                ))}
                <button
                  onClick={() => { signOutUser(); setIsMobileMenuOpen(false) }}
                  className="w-full text-left px-4 py-3 rounded-[var(--radius-lg)] text-[15px] text-text-muted hover:bg-surface transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { openAuthModal('signup'); setIsMobileMenuOpen(false); }}
                  className="flex items-center gap-3 w-full px-4 py-3 bg-accent text-accent-fg rounded-[var(--radius-lg)] text-[15px] font-medium"
                >
                  Register
                </button>
                <button
                  onClick={() => { openAuthModal('login'); setIsMobileMenuOpen(false) }}
                  className="w-full text-left px-4 py-3 rounded-[var(--radius-lg)] text-[15px] text-text hover:bg-surface transition-colors"
                >
                  Sign in
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
