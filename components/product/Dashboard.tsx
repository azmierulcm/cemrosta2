'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Clock, MapPin, Upload, ChevronDown, Calendar, Trash2, AlertTriangle, Check, X, Pencil, Send, ChevronUp, Paperclip, FileText, XCircle } from 'lucide-react';
import { useRoster } from '@/lib/contexts/RosterContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { DutyEvent } from '@/lib/types';
import { generateICS, downloadICS } from '@/lib/utils/calendar';
import { DutyCalendar } from './DutyCalendar';
import { DestinationPatch } from './DestinationPatch';
import { FileUploader } from './FileUploader';
import { RosterTile, dayEventsToDuty } from './RosterTile';
import { FamilyCard } from './family/FamilyCard';

// ── Constants ─────────────────────────────────────────────────────────────────

const GREETINGS = [
  'Hello',      // English
  '你好',        // Chinese (Mandarin)
  'Guten Tag',  // German
  'مرحباً',     // Arabic
  'Hej',        // Swedish
  'Hei',        // Norsk (Norwegian)
  'สวัสดี',     // Thai
  'Kamusta',    // Tagalog
  'Bonjour',    // French
  'Salut',      // Romanian / informal French
];

// ── Edit form helpers ─────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-black text-text-subtle uppercase tracking-[0.2em] font-mono">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-[14px] font-mono font-bold text-text focus:outline-none focus:border-accent transition-colors w-full";

// ── Event edit modal ──────────────────────────────────────────────────────────

function EventEditModal({
  event,
  onClose,
}: {
  event: DutyEvent;
  onClose: () => void;
}) {
  const { updateEvent } = useRoster();
  const isFlight  = event.type === 'FLIGHT';

  const [draft, setDraft]       = useState<DutyEvent>(event);
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const set = (key: keyof DutyEvent, val: string) =>
    setDraft((prev) => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await updateEvent(event.id, draft);
      onClose();
    } catch {
      setSaveError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        className="relative bg-white rounded-[2rem] shadow-2xl shadow-black/20 w-full max-w-xl max-h-[90vh] overflow-y-auto"
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isFlight ? 'bg-accent/5 text-accent border border-accent/10' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
              {isFlight ? <Plane className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-[10px] font-black text-text-subtle uppercase tracking-[0.2em] font-mono">Edit Duty</p>
              <p className="font-bold text-text text-sm">{event.date}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full text-text-subtle hover:text-text hover:bg-surface-2 border border-border transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div className="px-8 py-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date">
              <input className={inputCls} value={draft.date} onChange={(e) => set('date', e.target.value)} placeholder="YYYY-MM-DD" />
            </Field>

            {isFlight && (
              <>
                <Field label="Flight No.">
                  <input className={inputCls} value={draft.flightNumber ?? ''} onChange={(e) => set('flightNumber', e.target.value)} placeholder="MH 4" />
                </Field>
                <Field label="Dep Port">
                  <input className={inputCls} value={draft.depPort ?? ''} onChange={(e) => set('depPort', e.target.value.toUpperCase())} placeholder="KUL" maxLength={4} />
                </Field>
                <Field label="Arr Port">
                  <input className={inputCls} value={draft.arrPort ?? ''} onChange={(e) => set('arrPort', e.target.value.toUpperCase())} placeholder="LHR" maxLength={4} />
                </Field>
                <Field label="STD">
                  <input className={inputCls} value={draft.std ?? ''} onChange={(e) => set('std', e.target.value)} placeholder="09:00" />
                </Field>
                <Field label="STA">
                  <input className={inputCls} value={draft.sta ?? ''} onChange={(e) => set('sta', e.target.value)} placeholder="16:00" />
                </Field>
              </>
            )}

            <Field label="Sign On">
              <input className={inputCls} value={draft.signOn ?? ''} onChange={(e) => set('signOn', e.target.value)} placeholder="08:30" />
            </Field>
            <Field label="Sign Off">
              <input className={inputCls} value={draft.signOff ?? ''} onChange={(e) => set('signOff', e.target.value)} placeholder="17:30" />
            </Field>

            {isFlight && (
              <div className="col-span-2">
                <Field label="Hotel / Layover">
                  <input className={inputCls} value={draft.hotel ?? ''} onChange={(e) => set('hotel', e.target.value)} placeholder="Hilton London Heathrow" />
                </Field>
              </div>
            )}

            {!isFlight && (
              <div className="col-span-2">
                <Field label="Description">
                  <input className={inputCls} value={draft.description ?? ''} onChange={(e) => set('description', e.target.value)} placeholder="Duty description" />
                </Field>
              </div>
            )}
          </div>

          {saveError && (
            <p className="text-[12px] text-red-500 font-bold">{saveError}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-8 pb-8 pt-2 border-t border-border">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-accent text-accent-fg px-6 py-2.5 rounded-full text-[12px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-60"
          >
            <Check size={14} strokeWidth={3} />
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <button
            onClick={onClose}
            disabled={saving}
            className="flex items-center gap-2 text-text-muted hover:text-text border border-border px-6 py-2.5 rounded-full text-[12px] font-black uppercase tracking-widest transition-all"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Support / Bug-report widget ───────────────────────────────────────────────

const BUG_CATEGORIES = ['Parsing error', 'Wrong flight data', 'Missing duty', 'App bug', 'Other'];

function SupportWidget({
  userId,
  userEmail,
  rosterMonth,
  rosterYear,
}: {
  userId?: string;
  userEmail?: string;
  rosterMonth?: string;
  rosterYear?: string;
}) {
  const [open, setOpen]           = useState(false);
  const [category, setCategory]   = useState(BUG_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [file, setFile]           = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [status, setStatus]       = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const MAX_FILE_MB = 15;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] ?? null;
    e.target.value = ''; // reset so same file can be re-selected after removal
    if (!picked) return;
    if (picked.type !== 'application/pdf') {
      setFileError('Only PDF files are accepted.');
      return;
    }
    if (picked.size > MAX_FILE_MB * 1024 * 1024) {
      setFileError(`File is too large (max ${MAX_FILE_MB} MB).`);
      return;
    }
    setFileError(null);
    setFile(picked);
  };

  const handleSubmit = async () => {
    if (description.trim().length < 10) return;
    setStatus('sending');
    try {
      let res: Response;
      if (file) {
        const fd = new FormData();
        fd.append('userId',      userId      ?? '');
        fd.append('userEmail',   userEmail   ?? '');
        fd.append('category',    category);
        fd.append('description', description);
        if (rosterMonth) fd.append('rosterMonth', rosterMonth);
        if (rosterYear)  fd.append('rosterYear',  rosterYear);
        fd.append('file', file, file.name);
        res = await fetch('/api/support', { method: 'POST', body: fd });
      } else {
        res = await fetch('/api/support', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, userEmail, category, description, rosterMonth, rosterYear }),
        });
      }
      if (!res.ok) throw new Error('Server error');
      setStatus('sent');
      setDescription('');
      setFile(null);
      setTimeout(() => { setStatus('idle'); setOpen(false); }, 3000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <div className="mt-12 bg-surface-2 border border-border rounded-[2rem] overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-8 py-6 text-left hover:bg-surface transition-colors"
      >
        <div>
          <p className="text-[10px] font-black text-text-subtle uppercase tracking-[0.4em] font-mono mb-1">
            {'// MISSION SUPPORT'}
          </p>
          <p className="text-sm font-bold text-text-muted leading-snug">
            Found an error? Report it to our flight deck.
          </p>
        </div>
        {open
          ? <ChevronUp size={16} className="text-text-subtle shrink-0" />
          : <ChevronDown size={16} className="text-text-subtle shrink-0" />}
      </button>

      {/* Expandable form */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-8 pb-8 pt-2 space-y-4 border-t border-border">

              {/* Category pills */}
              <div>
                <p className="text-[10px] font-black text-text-subtle uppercase tracking-[0.2em] font-mono mb-3">Category</p>
                <div className="flex flex-wrap gap-2">
                  {BUG_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className="px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all"
                      style={{
                        background: category === cat ? 'var(--accent)' : 'transparent',
                        color: category === cat ? 'var(--accent-fg)' : 'var(--text-muted)',
                        borderColor: category === cat ? 'var(--accent)' : 'var(--border)',
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description textarea */}
              <div>
                <p className="text-[10px] font-black text-text-subtle uppercase tracking-[0.2em] font-mono mb-3">Description</p>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe what went wrong — e.g. flight MH4 on 6 May showed wrong arrival time..."
                  className="w-full bg-white border border-border rounded-xl px-4 py-3 text-[13px] font-mono text-text placeholder:text-text-subtle/50 focus:outline-none focus:border-accent resize-none transition-colors"
                  disabled={status === 'sending' || status === 'sent'}
                />
                <p className="mt-1 text-[10px] text-text-subtle font-mono">
                  {description.trim().length}/10 min chars
                </p>
              </div>

              {/* File attachment */}
              <div>
                <p className="text-[10px] font-black text-text-subtle uppercase tracking-[0.2em] font-mono mb-3">
                  Attach PDF <span className="font-normal normal-case tracking-normal opacity-60">(optional — helps us debug parsing issues)</span>
                </p>
                {file ? (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-surface">
                    <FileText size={14} className="text-accent shrink-0" aria-hidden="true" />
                    <span className="text-[12px] font-mono text-text flex-1 truncate">{file.name}</span>
                    <span className="text-[10px] text-text-subtle font-mono shrink-0">
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                    <button
                      onClick={() => { setFile(null); setFileError(null); }}
                      aria-label="Remove attachment"
                      className="text-text-subtle hover:text-danger transition-colors"
                    >
                      <XCircle size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-border hover:border-accent cursor-pointer transition-colors group">
                    <Paperclip size={14} className="text-text-subtle group-hover:text-accent transition-colors" aria-hidden="true" />
                    <span className="text-[12px] font-mono text-text-muted group-hover:text-text transition-colors">
                      Click to attach your roster PDF
                    </span>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="sr-only"
                      onChange={handleFileChange}
                      disabled={status === 'sending' || status === 'sent'}
                    />
                  </label>
                )}
                {fileError && (
                  <p className="mt-1.5 text-[11px] text-danger font-mono">{fileError}</p>
                )}
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={description.trim().length < 10 || status === 'sending' || status === 'sent'}
                className="flex items-center gap-2 px-6 py-3 rounded-full font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
              >
                {status === 'sending' && <><div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Sending…</>}
                {status === 'sent'    && <><Check size={14} strokeWidth={3} /> Report sent!</>}
                {status === 'error'   && <><X size={14} /> Failed — try again</>}
                {status === 'idle'    && <><Send size={13} /> Send Report</>}
              </button>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Today's Duty Strip ────────────────────────────────────────────────────────

function TodayStrip({ events }: { events: DutyEvent[] }) {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const todayEvents = events.filter(e => e.date === todayStr);

  if (todayEvents.length === 0) return null;

  const flights  = todayEvents.filter(e => e.type === 'FLIGHT');
  const primary  = flights[0] ?? todayEvents[0];
  const type     = primary.type;

  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const dayLabel = dayNames[today.getDay()];

  const configs: Record<string, { bg: string; border: string; label: string; icon: React.ReactNode }> = {
    FLIGHT:   { bg: 'bg-sky-50',    border: 'border-sky-200',   label: 'Flight Duty',  icon: <Plane size={15} className="text-sky-600" /> },
    STANDBY:  { bg: 'bg-amber-50',  border: 'border-amber-200', label: 'Standby',      icon: <Clock size={15} className="text-amber-600" /> },
    LAYOVER:  { bg: 'bg-amber-50',  border: 'border-amber-200', label: 'Layover',      icon: <MapPin size={15} className="text-amber-600" /> },
    OFF:      { bg: 'bg-green-50',  border: 'border-green-200', label: 'Rest Day',     icon: <Check size={15} className="text-green-600" /> },
    TRAINING: { bg: 'bg-teal-50',   border: 'border-teal-200',  label: 'Training',     icon: <Clock size={15} className="text-teal-600" /> },
    GROUND:   { bg: 'bg-teal-50',   border: 'border-teal-200',  label: 'Ground Duty',  icon: <Clock size={15} className="text-teal-600" /> },
  };
  const cfg = configs[type] ?? configs.OFF;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-10 rounded-2xl border px-5 py-4 flex flex-wrap items-center gap-4 ${cfg.bg} ${cfg.border}`}
    >
      {/* Today label */}
      <div className="flex items-center gap-2 shrink-0">
        {cfg.icon}
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-text-subtle font-mono">Today · {dayLabel}</p>
          <p className="text-[13px] font-bold text-text leading-tight">{cfg.label}</p>
        </div>
      </div>

      <div className="w-px h-8 bg-border/60 shrink-0 hidden sm:block" />

      {/* Flight-specific details */}
      {flights.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          {flights.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[15px] font-black text-text font-mono">
                {f.depPort} → {f.arrPort}
              </span>
              {f.flightNumber && (
                <span className="text-[11px] font-bold border border-current px-2 py-0.5 rounded-full font-mono text-sky-700">
                  {f.flightNumber}
                </span>
              )}
              {f.std && (
                <span className="text-[12px] font-semibold text-text-muted font-mono">
                  {f.std}{f.sta ? ` → ${f.sta}` : ''}
                </span>
              )}
              {i < flights.length - 1 && <span className="text-text-subtle">·</span>}
            </div>
          ))}
        </div>
      )}

      {/* Sign-on time for non-flight duties */}
      {flights.length === 0 && primary.signOn && (
        <span className="text-[14px] font-bold text-text-muted font-mono">
          {primary.signOn}{primary.signOff ? ` – ${primary.signOff}` : ''}
        </span>
      )}

      {/* Layover location */}
      {type === 'LAYOVER' && primary.arrPort && (
        <span className="text-[14px] font-bold text-text-muted">{primary.arrPort}</span>
      )}
    </motion.div>
  );
}

// ── Collapsible section wrapper ───────────────────────────────────────────────

function CollapsibleSection({
  title,
  badge,
  extra,
  defaultOpen = false,
  children,
}: {
  title: string;
  badge?: React.ReactNode;
  extra?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="mb-10">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 border-b border-border pb-4 group text-left"
      >
        <h3 className="text-3xl font-bold text-text tracking-tighter uppercase italic shrink-0">
          {title}
        </h3>
        <div className="h-px flex-1 bg-border/50" />
        {badge}
        {extra}
        <ChevronDown
          size={16}
          className={`text-text-subtle shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-6">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ── Duty grid (the new "Timeline") ────────────────────────────────────────────

function DutyGrid({ events }: { events: DutyEvent[] }) {
  const [editingEvent, setEditingEvent] = useState<DutyEvent | null>(null);

  if (events.length === 0) return null;

  // Derive month / year from events
  const [firstEvent] = events;
  const seedDate = new Date(firstEvent.date);
  const year  = seedDate.getFullYear();
  const month = seedDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Group events by date — multiple flights on one day become multi-leg duty
  const byDate = new Map<string, DutyEvent[]>();
  for (const e of events) {
    const bucket = byDate.get(e.date) ?? [];
    bucket.push(e);
    byDate.set(e.date, bucket);
  }

  // Primary event per date (for edit modal — we edit the first event of the day)
  const primaryByDate = new Map<string, DutyEvent>();
  for (const [date, evts] of byDate) {
    const flight = evts.find((e) => e.type === 'FLIGHT');
    primaryByDate.set(date, flight ?? evts[0]);
  }

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Only render days that have events (off days with no events are skipped —
  // the DutyCalendar on the right already shows the full month view)
  const dutyDays = Array.from({ length: daysInMonth }, (_, i) => {
    const dom  = i + 1;
    const mm   = String(month + 1).padStart(2, '0');
    const dd   = String(dom).padStart(2, '0');
    const date = `${year}-${mm}-${dd}`;
    return { date, dom, evts: byDate.get(date) ?? [] };
  }).filter((d) => d.evts.length > 0);

  return (
    <>
      {/* 2-column tile grid — each tile ~350px+, well above container-query collapse thresholds */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {dutyDays.map(({ date, dom, evts }) => {
          const isToday = date === todayStr;
          const primary = primaryByDate.get(date);
          const duty    = dayEventsToDuty(date, dom, evts);

          return (
            <div
              key={date}
              className={isToday ? 'ring-2 ring-accent/30 ring-offset-2 rounded-[var(--radius-tile)]' : ''}
            >
              <RosterTile
                duty={duty}
                onClick={primary ? () => setEditingEvent(primary) : undefined}
              />
            </div>
          );
        })}
      </div>

      {/* Edit modal */}
      <AnimatePresence>
        {editingEvent && (
          <EventEditModal
            event={editingEvent}
            onClose={() => setEditingEvent(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export const Dashboard = () => {
  const { activeRoster, rosters, activeRosterId, selectRoster, deleteRoster, isLoading } = useRoster();
  const { profile, user } = useAuth();
  const [showUpload, setShowUpload]           = useState(false);
  const [showRosterPicker, setShowRosterPicker] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId]   = useState<string | null>(null);

  // Typewriter greeting
  const [displayedGreeting, setDisplayedGreeting] = useState('');
  const [greetingIndex, setGreetingIndex] = useState(() =>
    Math.floor(Math.random() * GREETINGS.length)
  );

  useEffect(() => {
    const target = GREETINGS[greetingIndex];
    let frame: ReturnType<typeof setTimeout>;
    let charIndex = 0;
    let erasing = false;

    function tick() {
      if (!erasing) {
        charIndex++;
        setDisplayedGreeting(target.slice(0, charIndex));
        if (charIndex < target.length) {
          frame = setTimeout(tick, 65);
        } else {
          frame = setTimeout(() => { erasing = true; tick(); }, 1400);
        }
      } else {
        charIndex--;
        setDisplayedGreeting(target.slice(0, charIndex));
        if (charIndex > 0) {
          frame = setTimeout(tick, 35);
        } else {
          frame = setTimeout(() => {
            setGreetingIndex((i) => (i + 1) % GREETINGS.length);
          }, 300);
        }
      }
    }

    frame = setTimeout(tick, 65);
    return () => clearTimeout(frame);
  }, [greetingIndex]);

  const firstName = profile?.full_name?.split(' ')[0] || 'Crew';
  const [exportState, setExportState] = useState<'idle' | 'ok' | 'error'>('idle');

  if (!activeRoster) return null;

  const handleExport = () => {
    try {
      const icsContent = generateICS(activeRoster);
      if (!icsContent) {
        setExportState('error');
        setTimeout(() => setExportState('idle'), 3000);
        return;
      }
      downloadICS(icsContent, `roster-${activeRoster.month}-${activeRoster.year}.ics`);
      setExportState('ok');
      setTimeout(() => setExportState('idle'), 2500);
    } catch (err) {
      console.error('[handleExport]', err);
      setExportState('error');
      setTimeout(() => setExportState('idle'), 3000);
    }
  };

  const activeLabel = `${activeRoster.month} ${activeRoster.year}`;

  return (
    <div className="max-w-7xl mx-auto px-4 pb-32 pt-6">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-16 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4 text-[12px] font-black uppercase tracking-[0.3em] text-text-muted font-mono">
            <MapPin size={14} className="text-accent" />
            Mission Control
          </div>
          <h2 className="text-5xl md:text-7xl font-bold tracking-tighter text-text">
            <span className="text-accent">
              {displayedGreeting}
              <span className="animate-pulse" aria-hidden="true">|</span>
            </span>
            {', '}
            {firstName}.
          </h2>

          {/* Roster selector */}
          <div className="relative mt-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => rosters.length > 1 && setShowRosterPicker((v) => !v)}
                className={`flex items-center gap-3 font-bold text-lg tracking-tight transition-colors ${rosters.length > 1 ? 'text-text-muted hover:text-text cursor-pointer' : 'text-text-muted cursor-default'}`}
              >
                <Calendar size={16} className="text-accent" />
                {activeLabel}
                <span className="mx-1 text-border">·</span>
                <span>{activeRoster.events.length} Events</span>
                {rosters.length > 1 && (
                  <ChevronDown size={16} className={`transition-transform ${showRosterPicker ? 'rotate-180' : ''}`} />
                )}
              </button>

              {confirmDeleteId === activeRosterId ? (
                <div className="flex items-center gap-2 ml-2 bg-red-50 border border-red-200 rounded-full px-4 py-1.5">
                  <AlertTriangle size={12} className="text-red-500 shrink-0" />
                  <span className="text-[11px] font-black text-red-600">Delete {activeLabel}?</span>
                  <button
                    onClick={() => { deleteRoster(activeRosterId!); setConfirmDeleteId(null); setShowRosterPicker(false); }}
                    className="text-[10px] font-black uppercase tracking-wider text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-full transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="text-[10px] font-black uppercase tracking-wider text-text-muted hover:text-text px-2 py-1 rounded-full border border-red-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDeleteId(activeRosterId)}
                  aria-label={`Delete ${activeLabel} roster`}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-text-subtle hover:text-red-500 hover:bg-red-50 border border-border transition-all ml-1"
                >
                  <Trash2 size={14} strokeWidth={2.5} />
                </button>
              )}
            </div>

            <AnimatePresence>
              {showRosterPicker && rosters.length > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute top-full left-0 mt-3 bg-white border border-border rounded-[1.5rem] shadow-2xl shadow-black/10 z-50 overflow-hidden min-w-[280px]"
                >
                  {rosters.map((r) => (
                    <div
                      key={r.id}
                      className={`flex items-center border-b border-border/50 last:border-0 ${r.id === activeRosterId ? 'bg-accent/5' : ''}`}
                    >
                      <button
                        onClick={() => { selectRoster(r.id); setShowRosterPicker(false); setConfirmDeleteId(null); }}
                        className="flex-1 text-left px-6 py-4 hover:bg-surface-2 transition-colors"
                      >
                        <p className={`font-bold text-sm ${r.id === activeRosterId ? 'text-accent' : 'text-text'}`}>
                          {r.month} {r.year}
                        </p>
                        <p className="text-[10px] font-black text-text-subtle uppercase tracking-widest font-mono mt-0.5">
                          {r.totalSectors} Flights · {r.uniqueDestinations} Destinations
                        </p>
                      </button>
                      {r.id === activeRosterId && (
                        <div className="w-2 h-2 rounded-full bg-accent mr-5" />
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={() => setShowUpload((v) => !v)}
            className="px-8 py-4 rounded-full font-bold text-text hover:bg-surface-2 transition-all active:scale-95 border border-border flex items-center gap-2"
          >
            <Upload size={18} strokeWidth={2.5} />
            {showUpload ? 'Cancel' : 'Upload Another'}
          </button>
          <button
            onClick={handleExport}
            disabled={exportState !== 'idle'}
            className={`px-10 py-4 rounded-full font-bold text-lg flex items-center gap-3 shadow-xl transition-all active:scale-95 disabled:opacity-80 ${
              exportState === 'ok'
                ? 'bg-green-500 text-white shadow-green-200'
                : exportState === 'error'
                  ? 'bg-red-500 text-white shadow-red-200'
                  : 'bg-accent text-accent-fg shadow-accent/10 hover:bg-accent-hover'
            }`}
          >
            {exportState === 'ok' ? (
              <><Check className="w-5 h-5" strokeWidth={2.5} /> Downloaded!</>
            ) : exportState === 'error' ? (
              <><X className="w-5 h-5" strokeWidth={2.5} /> Failed — try again</>
            ) : (
              <>
                <Calendar className="w-5 h-5" strokeWidth={2.5} />
                <span className="flex flex-col items-start leading-tight">
                  <span>Add to Calendar</span>
                  <span className="text-[10px] font-[600] opacity-70 tracking-wide">Google · Apple · Outlook</span>
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Inline upload zone ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-16"
          >
            <div className="bg-white border border-border rounded-[2rem] p-10">
              <p className="text-[10px] font-black text-text-subtle uppercase tracking-[0.4em] font-mono mb-8">
                {'// ADD ANOTHER MONTH'}
              </p>
              <FileUploader onSuccess={() => setShowUpload(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Loading state ────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        </div>
      ) : (
        <>
          {/* ── Today's duty strip ──────────────────────────────────────────── */}
          <TodayStrip events={activeRoster.events} />

          {/* ── Destination stamps ──────────────────────────────────────────── */}
          {activeRoster.destinations && activeRoster.destinations.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
                <h3 className="text-3xl font-bold text-text tracking-tighter uppercase italic">Recent Stamps.</h3>
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-text-subtle font-mono bg-surface-2 px-4 py-2 rounded-full border border-border">
                  {activeRoster.destinations.length} Unlocked
                </div>
              </div>
              <div className="flex gap-6 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                {activeRoster.destinations.map((dest) => (
                  <DestinationPatch key={dest.iata} destination={dest} />
                ))}
              </div>
            </section>
          )}

          {/* ── Calendar + quick stats ───────────────────────────────────────── */}
          <section className="mb-10">
            <div className="flex items-center gap-4 mb-6 border-b border-border pb-4">
              <h3 className="text-3xl font-bold text-text tracking-tighter uppercase italic">Calendar.</h3>
              <div className="h-px flex-1 bg-border/50" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Calendar widget */}
              <div className="lg:col-span-5">
                <DutyCalendar />
              </div>
              {/* Quick stats */}
              <div className="lg:col-span-7 grid grid-cols-2 gap-3">
                {(() => {
                  const flights  = activeRoster.events.filter(e => e.type === 'FLIGHT').length;
                  const standby  = activeRoster.events.filter(e => e.type === 'STANDBY').length;
                  const offDays  = activeRoster.events.filter(e => e.type === 'OFF').length;
                  const blockHrs = activeRoster.stats?.totalBlockTime ?? '—';
                  const stats = [
                    { label: 'Trips',        value: flights,  sub: 'this month',    bg: 'bg-sky-50',    text: 'text-sky-700',   border: 'border-sky-100'   },
                    { label: 'Block Hours',  value: blockHrs, sub: 'logged',        bg: 'bg-accent/5',  text: 'text-accent',    border: 'border-accent/10' },
                    { label: 'Standby Days', value: standby,  sub: 'on call',       bg: 'bg-amber-50',  text: 'text-amber-700', border: 'border-amber-100' },
                    { label: 'Rest Days',    value: offDays,  sub: 'off duty',      bg: 'bg-green-50',  text: 'text-green-700', border: 'border-green-100' },
                  ];
                  return stats.map(s => (
                    <div key={s.label} className={`rounded-2xl border p-5 flex flex-col gap-1 ${s.bg} ${s.border}`}>
                      <span className={`text-[32px] font-black leading-none tracking-tight ${s.text}`}>{s.value}</span>
                      <span className="text-[13px] font-bold text-text leading-tight">{s.label}</span>
                      <span className="text-[11px] text-text-muted">{s.sub}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </section>

          {/* ── Family Hub (collapsible) ─────────────────────────────────────── */}
          {(() => {
            const flightCount  = activeRoster.events.filter(e => e.type === 'FLIGHT').length;
            const standbyCount = activeRoster.events.filter(e => e.type === 'STANDBY').length;
            return (
              <CollapsibleSection
                title="Family Hub."
                badge={
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-text-subtle font-mono bg-surface-2 px-3 py-1.5 rounded-full border border-border shrink-0">
                    {flightCount} flights · {standbyCount} standby
                  </span>
                }
              >
                <div className="rounded-[2rem] overflow-hidden border border-border">
                  <FamilyCard />
                </div>
              </CollapsibleSection>
            );
          })()}

          {/* ── Roster Details (collapsible) ─────────────────────────────────── */}
          {(() => {
            const totalDuties = activeRoster.events.filter(e => e.type !== 'OFF').length;
            return (
              <CollapsibleSection
                title="Roster Details."
                badge={
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-text-subtle font-mono bg-surface-2 px-3 py-1.5 rounded-full border border-border shrink-0">
                    {totalDuties} duties
                  </span>
                }
                extra={
                  <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-black text-text-subtle uppercase tracking-widest font-mono shrink-0">
                    <Pencil size={10} />
                    Tap tile to edit
                  </span>
                }
              >
                <div className="bg-white rounded-[2rem] border border-border p-5">
                  <DutyGrid events={activeRoster.events} />
                </div>
              </CollapsibleSection>
            );
          })()}

          <SupportWidget
            userId={user?.uid}
            userEmail={user?.email ?? undefined}
            rosterMonth={activeRoster.month}
            rosterYear={activeRoster.year}
          />
        </>
      )}
    </div>
  );
};

// Keep EventCard exported so any other file that imports it doesn't break
export { EventEditModal as EventCard };
