import React from 'react';
import { Plane, User } from 'lucide-react';
import Link from 'next/link';

const Navbar = () => {
  return (
    <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="bg-rausch p-2 rounded-lg">
              <Plane className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-rausch">Cemrosta</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 font-medium text-sm text-gray-600">
            <Link href="/" className="hover:text-black transition-colors">Home</Link>
            <Link href="/marketplace" className="hover:text-black transition-colors">Marketplace</Link>
            <Link href="/profile" className="flex items-center gap-2 hover:text-black transition-colors group">
              <div className="p-1.5 rounded-full bg-gray-100 group-hover:bg-rausch/10 group-hover:text-rausch transition-colors">
                <User size={16} />
              </div>
              My Profile
            </Link>
            <button className="bg-black text-white px-6 py-2.5 rounded-full hover:bg-gray-800 transition-all active:scale-95 shadow-sm">
              Sign In
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
