'use client';

import React from 'react';
import Image from 'next/image';
import { Share2 } from 'lucide-react';

interface ProfileHeaderProps {
  displayName: string;
  rank: string;
  base: string;
  aircraft: string;
  avatarUrl?: string | null;
  onShare?: () => void;
}

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(' ');
  const letters =
    parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : name.slice(0, 2);
  return (
    <div
      className="w-14 h-14 rounded-full bg-surface flex items-center justify-center shrink-0 border border-border"
      aria-hidden="true"
    >
      <span className="text-[16px] font-[500] text-text-muted tracking-tight select-none">
        {letters.toUpperCase()}
      </span>
    </div>
  );
}

export function ProfileHeader({
  displayName,
  rank,
  base,
  aircraft,
  avatarUrl,
  onShare,
}: ProfileHeaderProps) {
  return (
    <div className="bg-bg border border-border rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] p-8 flex items-center gap-5">
      {/* Avatar */}
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={displayName}
          width={56}
          height={56}
          className="rounded-full object-cover border border-border shrink-0"
        />
      ) : (
        <Initials name={displayName} />
      )}

      {/* Name block */}
      <div className="flex-1 min-w-0">
        <h1 className="text-[18px] font-[500] text-text leading-tight truncate">{displayName}</h1>
        <p className="text-[14px] text-text-muted mt-0.5 truncate">
          {rank} · {base} · {aircraft}
        </p>
      </div>

      {/* Share */}
      <button
        onClick={onShare}
        disabled={!onShare}
        className="shrink-0 h-10 px-5 bg-accent text-accent-fg rounded-[var(--radius-pill)] text-[13px] font-[500] flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Share your passport"
      >
        <Share2 size={15} strokeWidth={2} />
        Share
      </button>
    </div>
  );
}
