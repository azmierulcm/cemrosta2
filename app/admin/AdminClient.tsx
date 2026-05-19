'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import {
  Users, ShoppingBag, LayoutDashboard, Trash2, Pencil,
  Check, X, Loader2, ChevronDown, Shield, Eye, EyeOff,
} from 'lucide-react';
import {
  getAdminStats, adminGetAllUsers, adminUpdateUser, adminDeleteUser,
  type AdminUser, type AdminStats,
} from '@/lib/actions/admin';
import {
  adminGetAllListings, adminSetListingStatus, adminDeleteListing, adminUpdateListing,
} from '@/lib/actions/listings';
import type { Listing, ListingStatus } from '@/lib/types/marketplace';
import { CATEGORY_LABELS, CONDITION_LABELS } from '@/lib/types/marketplace';

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '').split(',').map((e) => e.trim()).filter(Boolean);

type Tab = 'overview' | 'listings' | 'users';

// ─────────────────────────────────────────────────────────────────────────────

export default function AdminClient() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');

  const isAdmin = !isLoading && !!user?.email && ADMIN_EMAILS.includes(user.email);

  useEffect(() => {
    if (!isLoading && !isAdmin) router.replace('/');
  }, [isLoading, isAdmin, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={24} className="animate-spin text-text-muted" />
      </div>
    );
  }
  if (!isAdmin) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-text-subtle font-mono mb-2">
          // Admin
        </p>
        <h1 className="text-4xl font-black tracking-tighter text-text leading-none flex items-center gap-3">
          <Shield size={32} className="text-accent" />
          Dashboard
        </h1>
        <p className="text-text-muted font-bold mt-2 text-sm">
          Manage users, listings and platform health.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-surface border border-border rounded-full p-1 w-fit">
        {([
          { id: 'overview',  label: 'Overview',  icon: LayoutDashboard },
          { id: 'listings',  label: 'Listings',  icon: ShoppingBag },
          { id: 'users',     label: 'Users',     icon: Users },
        ] as { id: Tab; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-black uppercase tracking-widest transition-all"
            style={{
              background: tab === id ? 'var(--accent)' : 'transparent',
              color:      tab === id ? 'var(--accent-fg)' : 'var(--text-muted)',
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab />}
      {tab === 'listings' && <ListingsTab />}
      {tab === 'users'    && <UsersTab />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Overview
// ─────────────────────────────────────────────────────────────────────────────

function OverviewTab() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    getAdminStats().then(setStats);
  }, []);

  if (!stats) return <Loader2 size={20} className="animate-spin text-text-muted" />;

  const cards = [
    { label: 'Total users',      value: stats.totalUsers },
    { label: 'Total listings',   value: stats.totalListings },
    { label: 'Active listings',  value: stats.activeListings },
    { label: 'Hidden listings',  value: stats.hiddenListings },
    { label: 'Sold listings',    value: stats.soldListings },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((c) => (
        <div key={c.label}
             className="flex flex-col gap-1 rounded-[var(--radius-xl)] border border-border bg-bg p-5 shadow-sm">
          <p className="text-[36px] font-black tracking-tighter text-text font-mono">{c.value}</p>
          <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">{c.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Listings
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<ListingStatus, string> = {
  active:  'var(--success)',
  hidden:  'var(--danger)',
  sold:    'var(--text-muted)',
  expired: 'var(--text-subtle)',
};

function ListingsTab() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading]   = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [editId, setEditId]     = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [filterStatus, setFilterStatus] = useState<ListingStatus | ''>('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setListings(await adminGetAllListings()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (id: string, status: ListingStatus) => {
    setActionId(id);
    try { await adminSetListingStatus(id, status); await load(); }
    finally { setActionId(null); }
  };

  const remove = async (id: string) => {
    if (!confirm('Permanently delete this listing?')) return;
    setActionId(id);
    try { await adminDeleteListing(id); setListings((p) => p.filter((l) => l.id !== id)); }
    finally { setActionId(null); }
  };

  const startEdit = (l: Listing) => {
    setEditId(l.id);
    setEditTitle(l.title);
    setEditPrice(String(l.price));
  };

  const saveEdit = async () => {
    if (!editId) return;
    setActionId(editId);
    try {
      await adminUpdateListing(editId, {
        title: editTitle,
        price: parseFloat(editPrice) || 0,
      });
      setListings((p) => p.map((l) =>
        l.id === editId ? { ...l, title: editTitle, price: parseFloat(editPrice) || l.price } : l,
      ));
      setEditId(null);
    } finally { setActionId(null); }
  };

  const visible = filterStatus
    ? listings.filter((l) => l.status === filterStatus)
    : listings;

  if (loading) return <Loader2 size={20} className="animate-spin text-text-muted" />;

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-black uppercase tracking-widest text-text-muted">Filter:</span>
        {(['', 'active', 'hidden', 'sold'] as (ListingStatus | '')[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider transition-all border border-border"
            style={{
              background: filterStatus === s ? 'var(--accent)' : 'var(--surface)',
              color:      filterStatus === s ? 'var(--accent-fg)' : 'var(--text-muted)',
            }}
          >
            {s || 'All'} {s && `(${listings.filter((l) => l.status === s).length})`}
          </button>
        ))}
        <span className="ml-auto text-[12px] font-bold text-text-muted">{visible.length} listings</span>
      </div>

      {/* Table */}
      <div className="rounded-[var(--radius-xl)] border border-border overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-surface">
              {['Title', 'Category', 'Price (RM)', 'Seller', 'Status', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-text-subtle">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visible.map((l) => (
              <tr key={l.id} className="bg-bg hover:bg-surface transition-colors">
                <td className="px-4 py-3 max-w-[200px]">
                  {editId === l.id ? (
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-2 py-1 rounded-lg border border-border bg-surface text-[13px] text-text focus:outline-none focus:border-accent"
                    />
                  ) : (
                    <span className="text-[13px] font-bold text-text line-clamp-1">{l.title}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-[12px] text-text-muted">{CATEGORY_LABELS[l.category] ?? l.category}</td>
                <td className="px-4 py-3">
                  {editId === l.id ? (
                    <input
                      type="number"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="w-24 px-2 py-1 rounded-lg border border-border bg-surface text-[13px] text-text focus:outline-none focus:border-accent"
                    />
                  ) : (
                    <span className="text-[13px] font-bold text-text">RM {l.price.toLocaleString()}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-[12px] text-text-muted">{l.sellerName}</td>
                <td className="px-4 py-3">
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white"
                    style={{ background: STATUS_COLORS[l.status] }}
                  >
                    {l.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {actionId === l.id ? (
                      <Loader2 size={14} className="animate-spin text-text-muted" />
                    ) : editId === l.id ? (
                      <>
                        <IconBtn onClick={saveEdit} title="Save" color="var(--success)"><Check size={13} /></IconBtn>
                        <IconBtn onClick={() => setEditId(null)} title="Cancel" color="var(--text-muted)"><X size={13} /></IconBtn>
                      </>
                    ) : (
                      <>
                        <IconBtn onClick={() => startEdit(l)} title="Edit" color="var(--accent)"><Pencil size={13} /></IconBtn>
                        {l.status === 'active'
                          ? <IconBtn onClick={() => setStatus(l.id, 'hidden')} title="Hide" color="var(--danger)"><EyeOff size={13} /></IconBtn>
                          : <IconBtn onClick={() => setStatus(l.id, 'active')} title="Restore" color="var(--success)"><Eye size={13} /></IconBtn>}
                        {l.status !== 'sold' && (
                          <IconBtn onClick={() => setStatus(l.id, 'sold')} title="Mark sold" color="var(--text-muted)">
                            <Check size={13} />
                          </IconBtn>
                        )}
                        <IconBtn onClick={() => remove(l.id)} title="Delete" color="var(--danger)"><Trash2 size={13} /></IconBtn>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && (
          <p className="text-center py-12 text-[13px] font-bold text-text-muted">No listings found.</p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Users
// ─────────────────────────────────────────────────────────────────────────────

function UsersTab() {
  const [users, setUsers]       = useState<AdminUser[]>([]);
  const [loading, setLoading]   = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [editId, setEditId]     = useState<string | null>(null);
  const [editFields, setEditFields] = useState<Partial<AdminUser>>({});
  const [search, setSearch]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setUsers(await adminGetAllUsers()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const startEdit = (u: AdminUser) => {
    setEditId(u.uid);
    setEditFields({ full_name: u.full_name, rank: u.rank, airline: u.airline, fleet: u.fleet, base: u.base });
  };

  const saveEdit = async () => {
    if (!editId) return;
    setActionId(editId);
    try {
      await adminUpdateUser(editId, editFields);
      setUsers((p) => p.map((u) => u.uid === editId ? { ...u, ...editFields } : u));
      setEditId(null);
    } finally { setActionId(null); }
  };

  const remove = async (uid: string, email: string) => {
    if (!confirm(`Delete user ${email}? This is irreversible.`)) return;
    setActionId(uid);
    try {
      await adminDeleteUser(uid);
      setUsers((p) => p.filter((u) => u.uid !== uid));
    } finally { setActionId(null); }
  };

  const filtered = search
    ? users.filter((u) =>
        [u.email, u.full_name, u.rank, u.base].some((v) =>
          v?.toLowerCase().includes(search.toLowerCase()),
        ),
      )
    : users;

  if (loading) return <Loader2 size={20} className="animate-spin text-text-muted" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          type="search"
          placeholder="Search by name, email or base…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-full border border-border bg-bg text-[13px] text-text focus:outline-none focus:border-accent transition-colors"
        />
        <span className="text-[12px] font-bold text-text-muted">{filtered.length} users</span>
      </div>

      <div className="rounded-[var(--radius-xl)] border border-border overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-surface">
              {['Avatar', 'Name / Email', 'Rank', 'Airline', 'Base', 'Verified', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-text-subtle whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((u) => {
              const isEditing = editId === u.uid;
              const isBusy    = actionId === u.uid;
              return (
                <tr key={u.uid} className="bg-bg hover:bg-surface transition-colors">
                  {/* Avatar */}
                  <td className="px-4 py-3">
                    {u.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover border border-border" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-[11px] font-black text-accent">
                        {(u.full_name || u.email || '?').slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </td>

                  {/* Name / Email */}
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        value={editFields.full_name ?? ''}
                        onChange={(e) => setEditFields((p) => ({ ...p, full_name: e.target.value }))}
                        placeholder="Full name"
                        className="w-full px-2 py-1 rounded-lg border border-border bg-surface text-[13px] text-text focus:outline-none focus:border-accent mb-1"
                      />
                    ) : (
                      <p className="text-[13px] font-bold text-text">{u.full_name || '—'}</p>
                    )}
                    <p className="text-[11px] text-text-muted">{u.email}</p>
                  </td>

                  {/* Rank */}
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        value={editFields.rank ?? ''}
                        onChange={(e) => setEditFields((p) => ({ ...p, rank: e.target.value }))}
                        placeholder="Rank"
                        className="w-full px-2 py-1 rounded-lg border border-border bg-surface text-[12px] text-text focus:outline-none focus:border-accent"
                      />
                    ) : (
                      <span className="text-[12px] text-text-muted">{u.rank || '—'}</span>
                    )}
                  </td>

                  {/* Airline */}
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        value={editFields.airline ?? ''}
                        onChange={(e) => setEditFields((p) => ({ ...p, airline: e.target.value }))}
                        placeholder="Airline"
                        className="w-full px-2 py-1 rounded-lg border border-border bg-surface text-[12px] text-text focus:outline-none focus:border-accent"
                      />
                    ) : (
                      <span className="text-[12px] text-text-muted">{u.airline || '—'}</span>
                    )}
                  </td>

                  {/* Base */}
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        value={editFields.base ?? ''}
                        onChange={(e) => setEditFields((p) => ({ ...p, base: e.target.value.toUpperCase() }))}
                        placeholder="Base"
                        maxLength={3}
                        className="w-16 px-2 py-1 rounded-lg border border-border bg-surface text-[12px] text-text focus:outline-none focus:border-accent"
                      />
                    ) : (
                      <span className="text-[12px] font-bold text-text">{u.base || '—'}</span>
                    )}
                  </td>

                  {/* Verified */}
                  <td className="px-4 py-3">
                    {u.verifiedAt ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black text-white uppercase tracking-wide"
                            style={{ background: 'var(--success)' }}>
                        <Check size={9} strokeWidth={3} /> Crew
                      </span>
                    ) : (
                      <span className="text-[11px] text-text-subtle font-bold">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {isBusy ? (
                        <Loader2 size={14} className="animate-spin text-text-muted" />
                      ) : isEditing ? (
                        <>
                          <IconBtn onClick={saveEdit} title="Save" color="var(--success)"><Check size={13} /></IconBtn>
                          <IconBtn onClick={() => setEditId(null)} title="Cancel" color="var(--text-muted)"><X size={13} /></IconBtn>
                        </>
                      ) : (
                        <>
                          <IconBtn onClick={() => startEdit(u)} title="Edit" color="var(--accent)"><Pencil size={13} /></IconBtn>
                          <IconBtn onClick={() => remove(u.uid, u.email)} title="Delete user" color="var(--danger)"><Trash2 size={13} /></IconBtn>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center py-12 text-[13px] font-bold text-text-muted">No users found.</p>
        )}
      </div>
    </div>
  );
}

// ── Shared icon button ────────────────────────────────────────────────────────

function IconBtn({
  onClick, title, color, children,
}: {
  onClick: () => void;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-7 h-7 rounded-lg flex items-center justify-center border border-border bg-surface hover:bg-bg transition-colors"
      style={{ color }}
    >
      {children}
    </button>
  );
}
