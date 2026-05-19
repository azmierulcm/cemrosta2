'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  User2, Plane, Building2, MapPin, FileText,
  Loader2, Check, ChevronDown, ArrowRight, Sparkles, Camera,
} from 'lucide-react';

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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-fill from existing profile
  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? '',
        rank:      profile.rank      ?? '',
        airline:   profile.airline   ?? '',
        fleet:     profile.fleet     ?? '',
        base:      profile.base      ?? '',
        bio:       profile.bio       ?? '',
      });
      setAvatarUrl(profile.avatar_url ?? null);
    }
  }, [profile]);

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
    setError(null);
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
      setError(err instanceof Error ? err.message : 'Photo upload failed.');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
        <div className="mb-10 p-5 rounded-[2rem] bg-accent/5 border border-accent/15 flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0">
            <Sparkles size={18} className="text-accent" />
          </div>
          <div>
            <div className="text-[11px] font-black uppercase tracking-widest text-accent font-mono mb-1">
              Welcome aboard
            </div>
            <p className="text-[14px] text-text font-medium leading-snug">
              Before you upload your first roster, tell us a bit about yourself — your name and rank help personalise the dashboard, passport, and recap cards.
            </p>
          </div>
        </div>
      )}

      {/* Page title */}
      <div className="mb-10">
        <div className="text-[10px] font-black uppercase tracking-[0.4em] text-text-subtle font-mono mb-3">
          {'// CREW PROFILE'}
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-text leading-none">
          Your settings.
        </h1>
        <p className="text-text-muted font-bold mt-3 text-base leading-snug">
          This info appears on your passport, dashboard greeting, and shareable recap cards.
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
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-border bg-surface-2 flex items-center justify-center">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="Profile photo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[22px] font-black text-text-muted select-none">
                    {(form.full_name || user?.email || '?').slice(0, 1).toUpperCase()}
                  </span>
                )}
              </div>
              {/* Camera overlay button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-accent text-accent-fg flex items-center justify-center shadow-md hover:bg-accent-hover transition-colors disabled:opacity-60"
                aria-label="Upload profile photo"
              >
                {uploadingPhoto
                  ? <Loader2 size={12} className="animate-spin" />
                  : <Camera size={12} />}
              </button>
            </div>

            {/* Info + trigger */}
            <div className="flex flex-col gap-1.5">
              <p className="text-[13px] font-black text-text">Profile photo</p>
              <p className="text-[12px] text-text-muted font-bold leading-snug">
                JPG, PNG or WebP · max 5 MB
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="self-start text-[12px] font-bold text-accent hover:underline underline-offset-4 transition-colors disabled:opacity-60"
              >
                {uploadingPhoto ? 'Uploading…' : avatarUrl ? 'Change photo' : 'Upload photo'}
              </button>
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
    </div>
  );
}
