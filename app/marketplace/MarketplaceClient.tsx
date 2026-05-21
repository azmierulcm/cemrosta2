'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getListings } from '@/lib/actions/listings';
import type { Listing, ListingCategory } from '@/lib/types/marketplace';
import { ListingCard } from '@/components/product/marketplace/ListingCard';
import { ListingFilters, type SortOption } from '@/components/product/marketplace/ListingFilters';

export default function MarketplaceClient() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [category, setCategory] = useState<ListingCategory | ''>('');
  const [sort, setSort] = useState<SortOption>('newest');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const results = await getListings({
        category: category || undefined,
        sort,
        verifiedOnly,
        limit: 24,
      });
      setListings(results);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load listings.');
    } finally {
      setLoading(false);
    }
  }, [category, sort, verifiedOnly]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchListings();
  }, [fetchListings]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 pt-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-text-subtle font-mono mb-2">
            {"// CREW MARKETPLACE"}
          </p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-text leading-none">Marketplace</h1>
          <p className="text-[14px] text-text-muted font-bold mt-2">Crew gear, verified sellers only.</p>
        </div>
        {user && (
          <Link
            href="/marketplace/new"
            className="flex items-center gap-2 px-5 py-3 rounded-[var(--radius-pill)] bg-accent text-accent-fg text-[13px] font-bold hover:bg-accent-hover transition-colors shadow-[var(--shadow-sm)] shrink-0"
          >
            <Plus size={16} />
            New Listing
          </Link>
        )}
      </div>

      {/* Filters */}
      <ListingFilters
        category={category}
        sort={sort}
        verifiedOnly={verifiedOnly}
        onCategory={setCategory}
        onSort={setSort}
        onVerifiedOnly={setVerifiedOnly}
      />

      {/* Error */}
      {fetchError && (
        <div className="px-4 py-3 rounded-[var(--radius-md)] bg-danger-soft border border-danger/20 text-[13px] text-danger font-bold">
          {fetchError}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={24} className="animate-spin text-text-muted" />
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-24 space-y-3">
          <p className="text-[15px] font-bold text-text">No listings found</p>
          <p className="text-[13px] text-text-muted font-medium">Try adjusting your filters or be the first to post!</p>
          {user && (
            <Link
              href="/marketplace/new"
              className="inline-flex items-center gap-2 mt-2 px-5 py-2.5 rounded-[var(--radius-pill)] bg-accent text-accent-fg text-[13px] font-bold hover:bg-accent-hover transition-colors"
            >
              <Plus size={15} />
              Post a listing
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
