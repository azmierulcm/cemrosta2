'use client';

import React from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { LogIn, ShoppingBag } from 'lucide-react';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading, openAuthModal } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-2 border border-border">
            <ShoppingBag size={28} className="text-accent" />
          </div>
          <div className="space-y-2">
            <h1 className="text-[22px] font-bold text-text tracking-tight">
              Crew-only Marketplace
            </h1>
            <p className="text-[14px] text-text-muted leading-relaxed">
              Sign in to browse and list gear. Only verified Malaysia Airlines crew can access the marketplace.
            </p>
          </div>
          <button
            onClick={() => openAuthModal('login')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-[var(--radius-pill)] bg-accent text-accent-fg text-[14px] font-semibold hover:bg-accent-hover transition-colors shadow-[var(--shadow-sm)]"
          >
            <LogIn size={16} />
            Sign in to continue
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate>{children}</AuthGate>;
}
