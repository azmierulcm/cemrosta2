'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/shared/Navbar';
import { supabase } from '@/lib/utils/supabase';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Loader2, ShieldAlert, CheckCircle, Trash2, ExternalLink, AlertTriangle } from 'lucide-react';
import { DateTime } from 'luxon';

// Simple allowlist as per Phase 6 requirements

const ADMIN_EMAILS = ['azmierulchemat@gmail.com', 'admin@cemrosta.com'];

export default function ModerationPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [reportedListings, setReportedListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user?.email && ADMIN_EMAILS.includes(user.email)) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  const fetchReportedListings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('marketplace_listings')
        .select(`
          *,
          profiles(full_name, airline),
          marketplace_reports(reason, details, created_at, reporter_id)
        `)
        .gt('reports_count', 0)
        .order('reports_count', { ascending: false });

      if (error) throw error;
      setReportedListings(data || []);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchReportedListings();
    }
  }, [isAdmin]);

  const handleDismiss = async (listingId: string) => {
    try {
      const { error } = await supabase
        .from('marketplace_listings')
        .update({ reports_count: 0, status: 'available' })
        .eq('id', listingId);

      if (error) throw error;
      
      // Optionally delete reports
      await supabase.from('marketplace_reports').delete().eq('listing_id', listingId);
      
      setReportedListings(prev => prev.filter(l => l.id !== listingId));
    } catch (err) {
      alert('Failed to dismiss reports');
    }
  };

  const handleDelete = async (listingId: string) => {
    if (!confirm('Are you sure you want to permanently hide this listing?')) return;
    try {
      const { error } = await supabase
        .from('marketplace_listings')
        .update({ status: 'hidden' })
        .eq('id', listingId);

      if (error) throw error;
      setReportedListings(prev => prev.map(l => l.id === listingId ? { ...l, status: 'hidden' } : l));
    } catch (err) {
      alert('Failed to hide listing');
    }
  };

  if (authLoading) return <div className="min-h-screen bg-bg flex items-center justify-center"><Loader2 className="animate-spin text-accent" /></div>;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4">
        <ShieldAlert size={64} className="text-danger mb-6" />
        <h1 className="text-3xl font-bold text-text mb-2">Access Denied</h1>
        <p className="text-text-muted mb-8 text-center max-w-md">This area is restricted to Cemrosta administrators only. If you believe this is an error, contact support.</p>
        <button onClick={() => window.location.href = '/'} className="px-8 py-3 bg-surface border border-border rounded-xl font-bold text-text">Return Home</button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-bg pb-20">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 pt-32">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold text-text tracking-tighter mb-2">Moderation Queue</h1>
            <p className="text-text-muted font-medium">Review reported marketplace listings.</p>
          </div>
          <div className="bg-surface border border-border px-6 py-3 rounded-2xl flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
             <span className="text-xs font-bold text-text uppercase tracking-widest font-mono">{reportedListings.length} Reports Pending</span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-accent" /></div>
        ) : reportedListings.length > 0 ? (
          <div className="space-y-6">
            {reportedListings.map((listing) => (
              <div key={listing.id} className="bg-surface border border-border rounded-[2rem] overflow-hidden flex flex-col md:flex-row">
                <div className="w-full md:w-64 h-48 md:h-auto bg-surface-2 shrink-0">
                  <img src={listing.image_urls?.[0]} alt="" className="w-full h-full object-cover opacity-80" />
                </div>
                <div className="flex-1 p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-bold text-text">{listing.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          listing.status === 'hidden' ? 'bg-danger/10 text-danger border border-danger/20' : 'bg-success/10 text-success border border-success/20'
                        }`}>
                          {listing.status}
                        </span>
                      </div>
                      <p className="text-sm text-text-muted">Listed by <span className="text-text font-bold">{listing.profiles?.full_name}</span> · {DateTime.fromISO(listing.created_at).toFormat('LLL dd, yyyy')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-danger/10 text-danger px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                        <AlertTriangle size={14} />
                        {listing.reports_count} Reports
                      </div>
                    </div>
                  </div>

                  <div className="bg-bg/50 rounded-2xl p-6 mb-8">
                    <h4 className="text-[10px] font-black text-text-subtle uppercase tracking-widest mb-4">Report Details</h4>
                    <div className="space-y-4">
                      {listing.marketplace_reports?.map((report: any, i: number) => (
                        <div key={i} className="border-l-2 border-border pl-4">
                          <p className="text-xs font-bold text-text mb-1 uppercase tracking-wide text-accent">{report.reason}</p>
                          <p className="text-sm text-text-muted italic">"{report.details || 'No details provided'}"</p>
                          <p className="text-[10px] text-text-subtle mt-1">{DateTime.fromISO(report.created_at).toFormat('LLL dd, yyyy, h:mm a')}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleDismiss(listing.id)}
                      className="flex-1 bg-surface-2 border border-border text-text py-4 rounded-xl font-bold hover:bg-border transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={18} />
                      Dismiss & Restore
                    </button>
                    <button 
                      onClick={() => handleDelete(listing.id)}
                      className="flex-1 bg-danger/10 text-danger border border-danger/20 py-4 rounded-xl font-bold hover:bg-danger hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 size={18} />
                      Keep Hidden
                    </button>
                    <a 
                      href={`/marketplace?id=${listing.id}`} 
                      target="_blank"
                      className="p-4 bg-surface-2 border border-border rounded-xl text-text-subtle hover:text-text transition-all"
                    >
                      <ExternalLink size={20} />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-40 bg-surface/30 rounded-[3rem] border border-dashed border-border">
            <CheckCircle size={48} className="text-success mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-text mb-2">All Clear</h3>
            <p className="text-text-muted font-medium">No pending reports in the queue.</p>
          </div>
        )}
      </div>
    </main>
  );
}
