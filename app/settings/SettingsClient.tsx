'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { getUserListings } from '@/lib/actions/listings';
import type { Listing } from '@/lib/types/marketplace';
import {
  User2, Plane, Building2, MapPin, FileText,
  Loader2, Check, ChevronDown, ArrowRight, Camera, Trash2,
  Lock, ShoppingBag, ExternalLink, Share2, Copy, RefreshCw, MessageCircle, AlertTriangle,
} from 'lucide-react';
import { FlipWords } from '@/components/shared/FlipWords';

/* ── Options ──────────────────────────────────────────────────────────────── */
const RANKS = [
  'Captain',
  'Senior First Officer',
  'First Officer',
  'Second Officer',
  'Purser',
  'Senior Cabin Crew',
  'Cabin Crew',
  'Cadet',
];

const FLEET = [
  'Airbus A350-900',
  'Airbus A330-300',
  'Airbus A330-200',
  'Boeing 737-800',
  'Boeing 737 MAX 8',
  'Boeing 777-200ER',
  'Boeing 787-9',
  'Mixed Fleet',
];

/* ── Field wrapper ────────────────────────────────────────────────────────── */
function Field({
  label, icon: Icon, children,
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-text-subtle font-mono">
        <Icon size={11} className="text-accent" />
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full bg-surface-2 border border-border rounded-2xl px-4 py-3 text-[14px] text-text font-medium placeholder:text-text-subtle focus:outline-none focus:border-accent focus:bg-white transition-colors';

const selectCls =
  'w-full bg-surface-2 border border-border rounded-2xl px-4 py-3 text-[14px] text-text font-medium focus:outline-none focus:border-accent focus:bg-white transition-colors appearance-none';

function SelectWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronDown
        size={15}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-text-subtle pointer-events-none"
      />
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────────────── */
export default function SettingsClient() {
  const { user, profile, setProfile, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOnboarding = searchParams.get('onboarding') === '1';

  const [form, setForm] = useState({
    full_name: '',
    rank: '',
    airline: '',
    fleet: '',
    base: '',
    bio: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deletingPhoto, setDeletingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pwResetSent, setPwResetSent] = useState(false);
  const [pwResetLoading, setPwResetLoading] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);

  // Spouse Share state
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  // Pre-fill from existing profile
  useEffect(() => {
    if (profile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        full_name: profile.full_name ?? '',
        rank:      profile.rank      ?? '',
        airline:   profile.airline   ?? '',
        fleet:     profile.fleet     ?? '',
        base:      profile.base      ?? '',
        bio:       profile.bio       ?? '',
      });
      setAvatarUrl(profile.avatar_url ?? null);
      setShareToken(profile.spouse_share_token ?? null);
    }
  }, [profile]);


  // Load user's listings
  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setListingsLoading(true);
    getUserListings(user.uid)
      .then(setListings)
      .catch(() => setListings([]))
      .finally(() => setListingsLoading(false));
  }, [user]);

  // Only redirect after auth has resolved — user starts null before Firebase responds
  useEffect(() => {
    if (!authLoading && !user && !saving) router.replace('/');
  }, [authLoading, user, saving, router]);

  const set = (k: keyof typeof form, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingPhoto(true);
    setPhotoError(null);
    try {
      const idToken = await user.getIdToken();
      const formData = new FormData();
      formData.append('file', file);

      const res  = await fetch('/api/profile/avatar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `Upload failed (${res.status})`);

      setAvatarUrl(json.url);
      setProfile({ ...(profile ?? { id: user.uid }), avatar_url: json.url });
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Photo upload failed.');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePhotoDelete = async () => {
    if (!user) return;
    setDeletingPhoto(true);
    setPhotoError(null);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/profile/avatar', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `Delete failed (${res.status})`);
      setAvatarUrl(null);
      setProfile({ ...(profile ?? { id: user.uid }), avatar_url: undefined });
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Could not remove photo.');
    } finally {
      setDeletingPhoto(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setPwResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      setPwResetSent(true);
    } catch {
      // silently ignore — email might not exist for OAuth users
    } finally {
      setPwResetLoading(false);
    }
  };

  const handleResetToken = async () => {
    if (!user) return;
    setIsResetting(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/user/share-token/reset', {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Reset failed');
      setShareToken(json.token);
      setProfile({ ...(profile ?? { id: user.uid }), spouse_share_token: json.token });
      setShowResetConfirm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset link.');
    } finally {
      setIsResetting(false);
    }
  };

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/roster/view?token=${shareToken}`
    : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = `Hey, here is my active flight roster: ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      // Get a fresh Firebase ID token to authenticate the API call server-side
      const idToken = await user.getIdToken();

      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || `Server error ${res.status}`);
      }

      // Mirror into context so Dashboard / Passport update without a reload
      setProfile({ id: user.uid, ...form });
      setSaved(true);
      if (isOnboarding) {
        setTimeout(() => router.push('/'), 1200);
      } else {
        setTimeout(() => setSaved(false), 2500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  // Show spinner while Firebase resolves auth state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-24 pb-32">

      {/* Onboarding welcome banner */}
      {isOnboarding && (
        <div className="mb-10 p-6 rounded-[2rem] bg-accent/5 border border-accent/15">
          {/* Heading with flip language effect */}
          <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-text leading-none mb-3 flex items-baseline gap-2 flex-wrap">
            Welcome Aboard.
            <FlipWords
              words={['Selamat Datang.', '欢迎登机.', 'Bienvenue.', 'Bienvenido.', '搭乗歡迎.', 'Willkommen.', 'أهلاً بك.']}
              duration={3200}
              className="text-accent italic"
            />
          </h2>

          {/* Subtitle */}
          <p className="text-[14px] text-text-muted font-bold leading-snug max-w-lg">
            A few details first — your name and rank help us personalise everything from your dashboard to your digital passport.{' '}
            <span className="text-text">Your passport and recap cards will thank you.</span>
          </p>
        </div>
      )}

      {/* Page title */}
      <div className="mb-10">
        <div className="text-[10px] font-black uppercase tracking-[0.4em] text-text-subtle font-mono mb-3">
          {'// CREW PROFILE'}
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-text leading-none min-h-[1.1em]">
          <FlipWords
            words={['Selamat Datang.', '欢迎登机.', 'Bienvenue.', 'Bienvenido.', '搭乗歡迎.', 'Willkommen.', 'أهلاً بك.']}
            duration={3200}
          />
        </h1>
        <p className="text-text-muted font-bold mt-3 text-base leading-snug max-w-lg">
          This is the info we use to make your passport, dashboard, and recap cards look{' '}
          <span className="text-text italic">professionally well-travelled.</span>
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Name */}
        <div className="bg-white border border-border rounded-[2rem] p-8 shadow-sm space-y-6">
          <div className="text-[10px] font-black uppercase tracking-[0.35em] text-text-subtle font-mono">
            Identity
          </div>

          {/* ── Profile photo ── */}
          <div className="flex items-center gap-5">
            {/* Avatar preview */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-border bg-accent/10 flex items-center justify-center">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Profile photo"
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[26px] font-black text-accent select-none leading-none">
                    {(form.full_name || user?.email || '?').slice(0, 1).toUpperCase()}
                  </span>
                )}
              </div>
              {/* Camera overlay button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto || deletingPhoto}
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-accent text-accent-fg flex items-center justify-center shadow-md hover:bg-accent-hover transition-colors disabled:opacity-60"
                aria-label="Upload profile photo"
              >
                {uploadingPhoto
                  ? <Loader2 size={12} className="animate-spin" />
                  : <Camera size={12} />}
              </button>
            </div>

            {/* Info + actions */}
            <div className="flex flex-col gap-1.5">
              <p className="text-[13px] font-black text-text">Profile photo</p>
              <p className="text-[12px] text-text-muted font-bold leading-snug">
                JPG, PNG or WebP · max 5 MB
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto || deletingPhoto}
                  className="text-[12px] font-bold text-accent hover:underline underline-offset-4 transition-colors disabled:opacity-60"
                >
                  {uploadingPhoto ? 'Uploading…' : avatarUrl ? 'Change photo' : 'Upload photo'}
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handlePhotoDelete}
                    disabled={uploadingPhoto || deletingPhoto}
                    className="flex items-center gap-1 text-[12px] font-bold text-danger hover:underline underline-offset-4 transition-colors disabled:opacity-60"
                    aria-label="Remove profile photo"
                  >
                    {deletingPhoto
                      ? <Loader2 size={11} className="animate-spin" />
                      : <Trash2 size={11} />}
                    {deletingPhoto ? 'Removing…' : 'Remove'}
                  </button>
                )}
              </div>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>

          {/* Photo upload error */}
          {photoError && (
            <p className="text-[12px] text-danger font-bold">{photoError}</p>
          )}

          <Field label="Full Name" icon={User2}>
            <input
              className={inputCls}
              placeholder="e.g. Muhammad Azmierul"
              value={form.full_name}
              onChange={(e) => set('full_name', e.target.value)}
            />
          </Field>

          <Field label="Rank" icon={Plane}>
            <SelectWrapper>
              <select
                className={selectCls}
                value={form.rank}
                onChange={(e) => set('rank', e.target.value)}
              >
                <option value="">Select your rank…</option>
                {RANKS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </SelectWrapper>
          </Field>

          <Field label="Bio" icon={FileText}>
            <textarea
              className={`${inputCls} resize-none h-20`}
              placeholder="Optional — a line about yourself"
              value={form.bio}
              onChange={(e) => set('bio', e.target.value)}
            />
          </Field>
        </div>

        {/* Airline & Fleet */}
        <div className="bg-white border border-border rounded-[2rem] p-8 shadow-sm space-y-6">
          <div className="text-[10px] font-black uppercase tracking-[0.35em] text-text-subtle font-mono">
            Airline
          </div>

          <Field label="Airline" icon={Building2}>
            <input
              className={inputCls}
              placeholder="e.g. Malaysia Airlines"
              value={form.airline}
              onChange={(e) => set('airline', e.target.value)}
            />
          </Field>

          <Field label="Fleet / Aircraft" icon={Plane}>
            <SelectWrapper>
              <select
                className={selectCls}
                value={form.fleet}
                onChange={(e) => set('fleet', e.target.value)}
              >
                <option value="">Select your fleet…</option>
                {FLEET.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </SelectWrapper>
          </Field>

          <Field label="Home Base" icon={MapPin}>
            <input
              className={inputCls}
              placeholder="e.g. KUL"
              maxLength={3}
              value={form.base}
              onChange={(e) => set('base', e.target.value.toUpperCase())}
            />
          </Field>
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-danger font-bold px-2">{error}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={saving || saved}
          className={`w-full flex items-center justify-center gap-3 py-5 rounded-full text-[15px] font-black transition-all shadow-lg ${
            saved
              ? 'bg-success text-white shadow-success/20'
              : 'bg-accent text-accent-fg hover:bg-accent-hover hover:scale-[1.02] active:scale-95 shadow-accent/20'
          } disabled:opacity-80`}
        >
          {saving ? (
            <><Loader2 size={18} className="animate-spin" /> Saving…</>
          ) : saved ? (
            isOnboarding
              ? <><Check size={18} strokeWidth={3} /> Saved! Taking you to the dashboard…</>
              : <><Check size={18} strokeWidth={3} /> Profile saved!</>
          ) : (
            isOnboarding
              ? <>Let&apos;s fly <ArrowRight size={18} strokeWidth={3} /></>
              : <>Save profile</>
          )}
        </button>

        {!isOnboarding && (
          <p className="text-center text-[12px] text-text-subtle font-bold">
            Changes are reflected immediately across the app.
          </p>
        )}
      </form>

      {/* ── Password ── */}
      {!isOnboarding && (
        <div className="mt-6 bg-white border border-border rounded-[2rem] p-8 shadow-sm space-y-4">
          <div className="text-[10px] font-black uppercase tracking-[0.35em] text-text-subtle font-mono">
            Security
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[13px] font-black text-text">Password</p>
              <p className="text-[12px] text-text-muted font-bold mt-0.5">
                {pwResetSent
                  ? 'Reset link sent — check your inbox.'
                  : 'Send a password reset link to your email.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handlePasswordReset}
              disabled={pwResetLoading || pwResetSent}
              className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full border border-border text-[12px] font-black text-text hover:bg-surface-2 transition-colors disabled:opacity-60"
            >
              {pwResetLoading ? <Loader2 size={13} className="animate-spin" /> : <Lock size={13} />}
              {pwResetSent ? 'Email sent' : 'Reset password'}
            </button>
          </div>
        </div>
      )}

      {/* ── Spouse Share ── */}
      {!isOnboarding && (
        <div className="mt-6 bg-white border border-border rounded-[2rem] p-8 shadow-sm space-y-4">
          <div className="text-[10px] font-black uppercase tracking-[0.35em] text-text-subtle font-mono">
            Family Sharing
          </div>
          <div>
            <p className="text-[13px] font-black text-text flex items-center gap-2">
              <Share2 size={14} className="text-accent" />
              Spouse & Family View
            </p>
            <p className="text-[12px] text-text-muted font-bold mt-1 leading-snug">
              Share a live, read-only view of your roster with your spouse or family.
              They can see where you are and when you&apos;re coming home.
            </p>
          </div>

          {shareToken ? (
            <div className="space-y-4 pt-2">
              <div className="relative">
                <input
                  readOnly
                  value={shareUrl}
                  className={`${inputCls} pr-12 font-mono text-[11px] bg-surface-1`}
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-accent hover:text-accent-hover transition-colors"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#25D366] text-white text-[13px] font-black hover:opacity-90 transition-opacity"
                >
                  <MessageCircle size={16} />
                  WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="flex items-center justify-center gap-2 py-3 rounded-2xl border border-danger/20 text-danger text-[13px] font-black hover:bg-danger/5 transition-colors"
                >
                  <RefreshCw size={14} />
                  Reset link
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-2">
              <button
                type="button"
                onClick={handleResetToken}
                disabled={isResetting}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-surface-2 border border-border text-[13px] font-black text-text hover:bg-white transition-all disabled:opacity-60"
              >
                {isResetting ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
                Generate Share Link
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── My listings ── */}
      {!isOnboarding && (
        <div className="mt-6 bg-white border border-border rounded-[2rem] p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-black uppercase tracking-[0.35em] text-text-subtle font-mono">
              My Listings
            </div>
            <Link
              href="/marketplace/new"
              className="text-[11px] font-black text-accent hover:underline underline-offset-4"
            >
              + New listing
            </Link>
          </div>

          {listingsLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 size={18} className="animate-spin text-text-muted" />
            </div>
          ) : listings.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <ShoppingBag size={28} className="text-text-subtle opacity-40" />
              <p className="text-[13px] font-bold text-text-muted">No listings yet.</p>
              <Link
                href="/marketplace/new"
                className="text-[12px] font-black text-accent hover:underline underline-offset-4"
              >
                Post something for sale
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {listings.map((l) => (
                <Link
                  key={l.id}
                  href={`/marketplace/${l.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 rounded-2xl hover:bg-surface-2 transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-black text-text truncate">{l.title}</p>
                    <p className="text-[11px] font-bold text-text-muted mt-0.5">
                      RM {l.price.toLocaleString()} ·{' '}
                      <span className={
                        l.status === 'active'  ? 'text-success' :
                        l.status === 'sold'    ? 'text-text-muted' :
                        l.status === 'expired' ? 'text-text-subtle' :
                        'text-danger'
                      }>
                        {l.status.charAt(0).toUpperCase() + l.status.slice(1)}
                      </span>
                    </p>
                  </div>
                  <ExternalLink size={14} className="text-text-subtle shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Reset confirmation modal ── */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-danger/10 flex items-center justify-center mb-6">
              <AlertTriangle size={32} className="text-danger" />
            </div>
            <h3 className="text-2xl font-black tracking-tight text-text leading-tight mb-2">
              Reset share link?
            </h3>
            <p className="text-[14px] text-text-muted font-bold leading-relaxed mb-8">
              The current link will stop working immediately. You&apos;ll need to send the new link to your family.
            </p>
            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={handleResetToken}
                disabled={isResetting}
                className="w-full py-4 rounded-full bg-danger text-white text-[15px] font-black hover:bg-danger-hover transition-all disabled:opacity-50"
              >
                {isResetting ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Yes, reset it'}
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="w-full py-4 rounded-full text-[15px] font-black text-text-muted hover:text-text transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
