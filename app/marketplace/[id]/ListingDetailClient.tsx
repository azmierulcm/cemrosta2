'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, MessageCircle, Mail, Flag, Pencil, Trash2, RotateCcw, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import type { Listing } from '@/lib/types/marketplace';
import { CATEGORY_LABELS, CONDITION_LABELS } from '@/lib/types/marketplace';
import { VerifiedPill } from '@/components/product/marketplace/VerifiedPill';
import { TrustCard } from '@/components/product/marketplace/TrustCard';
import { ContactRevealModal } from '@/components/product/marketplace/ContactRevealModal';
import { ReportModal } from '@/components/product/marketplace/ReportModal';
import { setListingStatus, deleteListing, renewListing } from '@/lib/actions/listings';

interface Props {
  listing: Listing;
}

export default function ListingDetailClient({ listing }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [imageIdx, setImageIdx] = useState(0);
  const [contactOpen, setContactOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const isOwner = user?.uid === listing.userId;
  const images = listing.images.length > 0 ? listing.images : [];
  const hasImages = images.length > 0;

  async function handleDelete() {
    if (!user) return;
    if (!confirm('Delete this listing? This cannot be undone.')) return;
    setBusy(true);
    try {
      await deleteListing(listing.id, user.uid);
      router.push('/marketplace');
    } finally {
      setBusy(false);
    }
  }

  async function handleMarkSold() {
    if (!user) return;
    setBusy(true);
    try {
      await setListingStatus(listing.id, user.uid, 'sold');
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleRenew() {
    if (!user) return;
    setBusy(true);
    try {
      await renewListing(listing.id, user.uid);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const expiresDate = new Date(listing.expiresAt);
  const daysLeft = Math.max(0, Math.ceil((expiresDate.getTime() - Date.now()) / 86400000));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back */}
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-1 text-[13px] text-text-muted hover:text-text transition-colors mb-6"
      >
        <ChevronLeft size={16} />
        Marketplace
      </Link>

      <div className="grid md:grid-cols-[1fr_360px] gap-8">
        {/* Left — images + description */}
        <div className="space-y-6">
          {/* Gallery */}
          <div className="relative aspect-[4/3] rounded-[var(--radius-xl)] overflow-hidden bg-surface-2 border border-border">
            {hasImages ? (
              <>
                <Image
                  key={imageIdx}
                  src={images[imageIdx]}
                  alt={listing.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 60vw"
                  priority
                />
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setImageIdx((i) => (i - 1 + images.length) % images.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={() => setImageIdx((i) => (i + 1) % images.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                    >
                      <ChevronRight size={18} />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {images.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setImageIdx(i)}
                          className={`w-1.5 h-1.5 rounded-full transition-colors ${i === imageIdx ? 'bg-white' : 'bg-white/40'}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-subtle text-[13px]">
                {CATEGORY_LABELS[listing.category]}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h2 className="text-[10px] font-black text-text-subtle uppercase tracking-[0.3em] font-mono">{"// DESCRIPTION"}</h2>
            <p className="text-[14px] text-text font-medium leading-relaxed whitespace-pre-wrap">{listing.description}</p>
          </div>

          <TrustCard />
        </div>

        {/* Right — details + actions */}
        <div className="space-y-5">
          {/* Status badge */}
          {listing.status !== 'active' && (
            <div className="px-3 py-2 rounded-[var(--radius-md)] bg-surface-2 border border-border text-[10px] font-black text-text-muted uppercase tracking-[0.3em] font-mono">
              {listing.status}
            </div>
          )}

          {/* Title + price */}
          <div>
            <div className="flex items-start gap-2 flex-wrap mb-1">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-text-subtle font-mono">
                {CATEGORY_LABELS[listing.category]}
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] px-2 py-0.5 rounded-full border border-border text-text-subtle font-mono">
                {CONDITION_LABELS[listing.condition]}
              </span>
            </div>
            <h1 className="text-2xl font-black text-text tracking-tight leading-snug">{listing.title}</h1>
            <p className="text-[28px] font-black text-text mt-2">RM {listing.price.toLocaleString()}</p>
          </div>

          {/* Seller */}
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface-2 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[14px] font-bold text-text">{listing.sellerName}</p>
              {listing.sellerVerified && <VerifiedPill />}
            </div>
            <p className="text-[12px] text-text-muted">{listing.sellerBase} · Member since {new Date(listing.sellerMemberSince).getFullYear()}</p>
          </div>

          {/* Expiry info */}
          <p className="text-[11px] text-text-subtle">
            {daysLeft > 0 ? `Expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}` : 'Expired'}
          </p>

          {/* Actions */}
          {isOwner ? (
            <div className="space-y-2">
              <Link
                href={`/marketplace/${listing.id}/edit`}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-[var(--radius-pill)] border border-border text-[13px] font-bold text-text hover:bg-surface transition-colors"
              >
                <Pencil size={14} />
                Edit Listing
              </Link>
              {listing.status !== 'sold' && (
                <button
                  onClick={handleMarkSold}
                  disabled={busy}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-[var(--radius-pill)] border border-success/40 text-[13px] font-bold text-success hover:bg-success/5 disabled:opacity-60 transition-colors"
                >
                  <CheckCircle size={14} />
                  Mark as Sold
                </button>
              )}
              {(listing.status === 'expired' || daysLeft <= 7) && listing.status !== 'sold' && (
                <button
                  onClick={handleRenew}
                  disabled={busy}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-[var(--radius-pill)] border border-accent/40 text-[13px] font-bold text-accent hover:bg-accent-soft disabled:opacity-60 transition-colors"
                >
                  <RotateCcw size={14} />
                  Renew for 30 days
                </button>
              )}
              <button
                onClick={handleDelete}
                disabled={busy}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-[var(--radius-pill)] border border-destructive/30 text-[13px] font-bold text-destructive hover:bg-destructive/5 disabled:opacity-60 transition-colors"
              >
                <Trash2 size={14} />
                Delete Listing
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {listing.status === 'active' && (
                <button
                  onClick={() => setContactOpen(true)}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-[var(--radius-pill)] bg-accent text-accent-fg text-[14px] font-bold hover:bg-accent-hover transition-colors shadow-[var(--shadow-sm)]"
                >
                  {listing.contactPref === 'whatsapp' ? (
                    <MessageCircle size={16} />
                  ) : (
                    <Mail size={16} />
                  )}
                  Contact Seller
                </button>
              )}
              {user && (
                <button
                  onClick={() => setReportOpen(true)}
                  className="flex items-center justify-center gap-2 w-full py-2 text-[12px] text-text-subtle hover:text-destructive transition-colors"
                >
                  <Flag size={13} />
                  Report listing
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ContactRevealModal
        isOpen={contactOpen}
        onClose={() => setContactOpen(false)}
        listingTitle={listing.title}
        contactPref={listing.contactPref}
        contactValue={listing.contactValue}
      />
      {user && (
        <ReportModal
          isOpen={reportOpen}
          onClose={() => setReportOpen(false)}
          listingId={listing.id}
          reportingUserId={user.uid}
        />
      )}
    </div>
  );
}
