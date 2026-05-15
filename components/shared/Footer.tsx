'use client';

import React from 'react';
import Link from 'next/link';
import { X, Camera, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-bg border-t border-border pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="flex flex-col gap-1">
                <div className="w-5 h-1 bg-accent/30" />
                <div className="w-5 h-2 bg-accent/60" />
                <div className="w-5 h-4 bg-accent" />
              </div>
              <span className="text-xl font-bold tracking-tight text-text">Cemrosta</span>
            </Link>
            <p className="text-text-muted text-sm font-medium leading-relaxed mb-6">
              Made for the crew, by the crew. <br />
              Own your flight data.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="p-2 bg-surface border border-border rounded-lg text-text-muted hover:text-accent transition-colors">
                <X size={18} />
              </Link>
              <Link href="#" className="p-2 bg-surface border border-border rounded-lg text-text-muted hover:text-accent transition-colors">
                <Camera size={18} />
              </Link>
              <a href="mailto:hello@cemrosta.com" className="p-2 bg-surface border border-border rounded-lg text-text-muted hover:text-accent transition-colors">
                <Mail size={18} />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-text-subtle mb-6 font-mono">// PRODUCT</h4>
            <ul className="space-y-4">
              <li><Link href="/profile" className="text-sm font-medium text-text-muted hover:text-text transition-colors">Digital Passport</Link></li>
              <li><Link href="/marketplace" className="text-sm font-medium text-text-muted hover:text-text transition-colors">Marketplace</Link></li>
              <li><Link href="#" className="text-sm font-medium text-text-muted hover:text-text transition-colors">Mobile Sync</Link></li>
            </ul>
          </div>

          {/* Supported Airlines */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-text-subtle mb-6 font-mono">// FLEET SUPPORT</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                <span className="text-sm font-medium text-text">Malaysia Airlines</span>
              </li>
              <li className="flex items-center gap-2 opacity-50">
                <span className="w-1.5 h-1.5 rounded-full bg-text-subtle" />
                <span className="text-sm font-medium text-text-muted">AirAsia (Soon)</span>
              </li>
              <li className="flex items-center gap-2 opacity-50">
                <span className="w-1.5 h-1.5 rounded-full bg-text-subtle" />
                <span className="text-sm font-medium text-text-muted">Batik Air (Soon)</span>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-text-subtle mb-6 font-mono">// LEGAL</h4>
            <ul className="space-y-4">
              <li><Link href="/privacy" className="text-sm font-medium text-text-muted hover:text-text transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm font-medium text-text-muted hover:text-text transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-12 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] font-bold text-text-subtle uppercase tracking-[0.4em] font-mono">
            © 2026 Cemrosta • All Flights Reserved
          </p>
          <div className="text-[10px] font-bold text-text-subtle uppercase tracking-[0.4em] font-mono">
            BUILD 26.05.15
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
