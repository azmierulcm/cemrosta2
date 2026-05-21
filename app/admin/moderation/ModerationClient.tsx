'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Flag, ShieldCheck, Trash2, Loader2, ExternalLink } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getModQueue, restoreListing, deleteListing } from '@/lib/actions/listings';
import type { Listing } from '@/lib/types/marketplace';
import { CATEGORY_LABELS, CONDITION_LABELS } from '@/lib/types/marketplace';

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '').split(',').map((e) => e.trim()).filter(Boolean);

export default function ModerationClient() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getModQueue();
      setListings(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && isAdmin) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchQueue();
    }
  }, [isLoading, isAdmin, fetchQueue]);

  useEffect(() => {
    if (!isLoading && !isAdmin) router.replace('/');
  }, [isLoading, isAdmin, router]);

  async function handleRestore(id: string) {
    setActionId(id);
    try {
      await restoreListing(id);
      setListings((prev) => prev.filter((l) => l.id !== id));
    } finally {
      setActionId(null);
    }
  }

  async function handleDelete(id: string, userId: string) {
    if (!confirm('Permanently delete this listing?')) return;
    setActionId(id);
    try {
      await deleteListing(id, userId);
      setListings((prev) => prev.filter((l) => l.id !== id));
    } finally {
      setActionId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={24} className="animate-spin text-text-muted" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-[28px] font-bold text-text tracking-tight">Moderation Queue</h1>
        <p className="text-[13px] text-text-muted mt-1">
          {listings.length} hidden listing{listings.length !== 1 ? 's' : ''} awaiting review
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={24} className="animate-spin text-text-muted" />
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-24">
          <ShieldCheck size={36} className="text-success mx-auto mb-3" />
          <p className="text-[15px] font-semibold text-text">Queue is clear</p>
          <p className="text-[13px] text-text-muted mt-1">No reported listings at this time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="rounded-[var(--radius-lg)] border border-border bg-bg p-4 flex gap-4 items-start"
            >
              {/* Thumbnail */}
              <div className="relative w-20 h-20 shrink-0 rounded-[var(--radius-md)] overflow-hidden bg-surface-2 border border-border">
                {listing.images[0] ? (
                  <Image src={listing.images[0]} alt={listing.title} fill className="object-cover" sizes="80px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-text-subtle font-mono">
                    {CATEGORY_LABELS[listing.category]}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-start gap-2 flex-wrap">
                  <Link
                    href={`/marketplace/${listing.id}`}
                    target="_blank"
                    className="text-[14px] font-semibold text-text hover:text-accent transition-colors flex items-center gap-1"
                  >
                    {listing.title}
                    <ExternalLink size={12} />
                  </Link>
                </div>
                <p className="text-[12px] text-text-muted">
                  {CONDITION_LABELS[listing.condition]} · RM {listing.price.toLocaleString()} · {listing.sellerName} ({listing.sellerBase})
                </p>
                <div className="flex items-center gap-1.5 text-[12px] text-destructive font-semibold">
                  <Flag size={12} />
                  {listing.reportCount} report{listing.reportCount !== 1 ? 's' : ''}
                </div>
                <p className="text-[11px] text-text-subtle line-clamp-2">{listing.description}</p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={() => handleRestore(listing.id)}
                  disabled={actionId === listing.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-pill)] border border-success/40 text-[12px] font-semibold text-success hover:bg-success/5 disabled:opacity-60 transition-colors"
                >
                  {actionId === listing.id ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
                  Restore
                </button>
                <button
                  onClick={() => handleDelete(listing.id, listing.userId)}
                  disabled={actionId === listing.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-pill)] border border-destructive/30 text-[12px] font-semibold text-destructive hover:bg-destructive/5 disabled:opacity-60 transition-colors"
                >
                  {actionId === listing.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
