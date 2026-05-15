'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, MessageCircle, ShieldCheck, AlertTriangle, Flag, Clock } from 'lucide-react';
import { DateTime } from 'luxon';
import { useAuth } from '@/lib/contexts/AuthContext';
import { trackEvent } from '@/lib/analytics/events';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: string;
  category: string;
  image_urls: string[];
  seller_id: string;
  created_at: string;
  expires_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string;
    rank: string;
    airline?: string;
    verified_at?: string | null;
  };
}

const ListingDetailModal = ({ listing, isOpen, onClose }: { listing: Listing | null, isOpen: boolean, onClose: () => void }) => {
  const { user } = useAuth();
  const [currentImg, setCurrentImg] = React.useState(0);
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState('spam');
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  // Reset image index when listing changes
  React.useEffect(() => {
    setCurrentImg(0);
    setIsReporting(false);
    setReportSuccess(false);
    setReportReason('spam');
    setReportDetails('');
  }, [listing?.id, isOpen]);

  if (!listing) return null;

  const handleReport = async () => {
    if (!user) {
      alert('You must be logged in to report a listing.');
      return;
    }
    setIsSubmittingReport(true);
    try {
      const { reportListing } = await import('@/lib/actions/marketplace');
      await reportListing({
        listingId: listing.id,
        reporterId: user.id,
        reason: reportReason,
        details: reportDetails
      });
      trackEvent('MARKETPLACE_REPORT_SUBMITTED', { listing_id: listing.id, reason: reportReason });
      setReportSuccess(true);
      setTimeout(() => {
        setIsReporting(false);
        setReportSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to report:', err);
      alert('Failed to submit report. Please try again.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const images = (listing.image_urls && listing.image_urls.length > 0) 
    ? listing.image_urls 
    : ["https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800"];

  const isVerified = !!listing.profiles?.verified_at;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-4 text-left">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-bg w-full max-w-6xl md:rounded-[3rem] relative z-10 shadow-2xl overflow-hidden flex flex-col md:flex-row h-full md:h-[85vh]"
          >
            <button 
              onClick={onClose} 
              className="absolute top-6 right-6 z-50 p-3 bg-bg/90 backdrop-blur-md hover:bg-bg rounded-full transition-all shadow-xl border border-border"
            >
              <X size={20} className="text-text" />
            </button>

            {/* Left: Image Carousel */}
            <div className="w-full md:w-3/5 bg-surface-2 relative group h-1/3 md:h-full">
              <img 
                src={images[currentImg]} 
                alt={listing.title} 
                className="w-full h-full object-cover"
              />
              
              {images.length > 1 && (
                <>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setCurrentImg(prev => (prev > 0 ? prev - 1 : images.length - 1)); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-bg/90 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setCurrentImg(prev => (prev < images.length - 1 ? prev + 1 : 0)); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-bg/90 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight size={24} />
                  </button>
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                     {images.map((_, i) => (
                       <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === currentImg ? 'bg-bg w-6' : 'bg-bg/40'}`} />
                     ))}
                  </div>
                </>
              )}
            </div>

            {/* Right: Details Section */}
            <div className="w-full md:w-2/5 p-8 md:p-12 overflow-y-auto no-scrollbar flex flex-col">
              <div className="mb-8">
                 <div className="flex flex-wrap items-center gap-2 mb-6">
                    {isVerified ? (
                      <div className="bg-success/10 text-success px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border border-success/20 flex items-center gap-2">
                        <ShieldCheck size={14} strokeWidth={3} />
                        Verified {listing.profiles?.airline || 'Crew'}
                      </div>
                    ) : (
                      <div className="bg-surface-2 text-text-subtle px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border border-border flex items-center gap-2">
                        <AlertTriangle size={14} strokeWidth={3} />
                        Unverified Seller
                      </div>
                    )}
                 </div>
                 
                 <h2 className="text-4xl font-bold text-text leading-tight mb-4 tracking-tight">{listing.title}</h2>
                 <p className="text-5xl font-black text-accent tracking-tighter mb-8">RM{listing.price}</p>

                 <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-surface p-4 rounded-2xl border border-border">
                       <p className="text-[10px] font-bold text-text-subtle uppercase tracking-widest mb-1 font-mono">Category</p>
                       <p className="text-sm font-bold text-text">{listing.category}</p>
                    </div>
                    <div className="bg-surface p-4 rounded-2xl border border-border">
                       <p className="text-[10px] font-bold text-text-subtle uppercase tracking-widest mb-1 font-mono">Condition</p>
                       <p className="text-sm font-bold text-text">{listing.condition}</p>
                    </div>
                 </div>

                 <div className="bg-warning/5 border border-warning/20 p-5 rounded-2xl mb-8">
                    <p className="text-[10px] font-black text-warning uppercase tracking-widest mb-2 flex items-center gap-2">
                       <AlertTriangle size={12} strokeWidth={3} />
                       Buyer Protection Disclaimer
                    </p>
                    <p className="text-[11px] text-text-muted leading-relaxed font-medium">
                       Cemrosta does not process payments. Arrange directly with the seller. Meet in a safe public location. Verify authenticity before exchanging cash.
                    </p>
                 </div>
              </div>

              <div className="prose prose-sm text-text-muted font-medium leading-relaxed mb-12 flex-1">
                 <p className="whitespace-pre-wrap">{listing.description || "No description provided."}</p>
              </div>

              <div className="space-y-6">
                 {/* Seller Card */}
                 <div className="bg-surface p-6 rounded-3xl border border-border flex items-center gap-4 group">
                    <div className="w-14 h-14 rounded-2xl bg-bg border border-border overflow-hidden relative">
                       <img 
                         src={listing.profiles?.avatar_url || `https://i.pravatar.cc/150?u=${listing.seller_id}`} 
                         alt="Seller" 
                         className="w-full h-full object-cover" 
                       />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-text-subtle uppercase tracking-widest mb-0.5">Listed By</p>
                      <p className="text-lg font-bold text-text">{listing.profiles?.full_name || "Crew Member"}</p>
                      <p className="text-xs text-accent font-medium">{listing.profiles?.rank || 'Malaysia Airlines'}</p>
                    </div>
                 </div>

                 <div className="flex items-center gap-3">
                    <button className="flex-1 bg-accent text-accent-fg py-5 rounded-2xl font-bold text-lg hover:bg-accent-hover transition-all active:scale-[0.98] shadow-xl flex items-center justify-center gap-3">
                       <MessageCircle size={22} strokeWidth={2.5} />
                       Message Seller
                    </button>
                    <button 
                      onClick={() => setIsReporting(true)}
                      className="p-5 bg-surface border border-border rounded-2xl text-text-subtle hover:text-danger hover:border-danger/30 transition-all active:scale-95"
                      title="Report Listing"
                    >
                       <Flag size={22} />
                    </button>
                 </div>
                 
                 <div className="flex justify-between items-center px-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-text-subtle uppercase tracking-widest font-mono">
                       <Clock size={12} />
                       Expires {DateTime.fromISO(listing.expires_at).toFormat('LLL dd, yyyy')}
                    </div>
                    <div className="text-[10px] font-bold text-text-subtle uppercase tracking-widest font-mono">
                       ID: {listing.id.slice(0, 8)}
                    </div>
                 </div>
              </div>
            </div>

            {/* Reporting Overlay */}
            <AnimatePresence>
              {isReporting && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute inset-0 z-[60] bg-bg/95 backdrop-blur-xl flex items-center justify-center p-8"
                >
                  <div className="w-full max-w-md">
                    {reportSuccess ? (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-6">
                          <ShieldCheck size={40} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-2xl font-bold text-text mb-2">Report Submitted</h3>
                        <p className="text-text-muted">Thank you for helping keep our community safe. Our team will review this listing.</p>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-3xl font-bold text-text mb-2 tracking-tight">Report Listing</h3>
                        <p className="text-text-muted mb-8">Tell us what's wrong with this listing. Your report is anonymous.</p>
                        
                        <div className="space-y-3 mb-8">
                          {['spam', 'fraud', 'inappropriate', 'other'].map((reason) => (
                            <button
                              key={reason}
                              onClick={() => setReportReason(reason)}
                              className={`w-full p-4 rounded-2xl border transition-all text-left flex items-center justify-between group ${
                                reportReason === reason 
                                  ? 'bg-accent/10 border-accent text-accent' 
                                  : 'bg-surface border-border text-text-muted hover:border-text-subtle'
                              }`}
                            >
                              <span className="font-bold capitalize">{reason}</span>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                reportReason === reason ? 'border-accent bg-accent' : 'border-border group-hover:border-text-subtle'
                              }`}>
                                {reportReason === reason && <div className="w-2 h-2 bg-accent-fg rounded-full" />}
                              </div>
                            </button>
                          ))}
                        </div>

                        <div className="mb-8">
                          <label className="text-[10px] font-black text-text-subtle uppercase tracking-widest mb-2 block">Additional Details</label>
                          <textarea 
                            value={reportDetails}
                            onChange={(e) => setReportDetails(e.target.value)}
                            placeholder="Please provide more context..."
                            className="w-full bg-surface border border-border rounded-2xl p-4 text-text placeholder:text-text-subtle focus:border-accent outline-none transition-all h-32 resize-none"
                          />
                        </div>

                        <div className="flex gap-4">
                          <button 
                            onClick={() => setIsReporting(false)}
                            className="flex-1 py-4 bg-surface border border-border rounded-2xl font-bold text-text hover:bg-surface-2 transition-all"
                          >
                            Cancel
                          </button>
                          <button 
                            disabled={isSubmittingReport}
                            onClick={handleReport}
                            className="flex-1 py-4 bg-danger text-white rounded-2xl font-bold hover:bg-danger/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {isSubmittingReport ? (
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <>Submit Report</>
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ListingDetailModal;
