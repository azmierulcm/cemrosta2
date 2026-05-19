'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { createListing } from '@/lib/actions/listings';
import { ListingForm } from '@/components/product/marketplace/ListingForm';
import type { ListingInput } from '@/lib/types/marketplace';

export default function NewListingPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');

  async function handleSubmit(data: ListingInput) {
    if (!user || !profile) return;
    setError('');
    try {
      const id = await createListing({
        userId: user.uid,
        sellerName: profile.full_name ?? user.displayName ?? 'Crew Member',
        sellerBase: profile.rank ?? 'KUL',
        sellerMemberSince: user.metadata.creationTime ?? new Date().toISOString(),
        input: data,
      });
      router.push(`/marketplace/${id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create listing');
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-1 text-[13px] text-text-muted hover:text-text transition-colors"
      >
        <ChevronLeft size={16} />
        Marketplace
      </Link>

      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-text-subtle font-mono mb-2">
          {"// NEW LISTING"}
        </p>
        <h1 className="text-3xl font-black tracking-tighter text-text">Post gear for sale</h1>
        <p className="text-[13px] text-text-muted font-bold mt-1.5">
          Listings are automatically removed after <span className="text-text font-black">30 days</span>.
        </p>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-[var(--radius-md)] bg-destructive/10 border border-destructive/30 text-[13px] text-destructive">
          {error}
        </div>
      )}

      <ListingForm onSubmit={handleSubmit} submitLabel="Post Listing" />
    </div>
  );
}
