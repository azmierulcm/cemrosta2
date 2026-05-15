'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, Copy, Check, Loader2, Smartphone, Monitor } from 'lucide-react';

interface RecapCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  month: string;
  year: string;
}

const RecapCardModal = ({ isOpen, onClose, userId, month, year }: RecapCardModalProps) => {
  const [view, setView] = useState<'stories' | 'card'>('stories');
  const [isCopied, setIsOldVisible] = useState(false);
  
  const storiesUrl = `/api/recap/${userId}/${year}/${month}/stories`;
  const cardUrl = `/api/recap/${userId}/${year}/${month}/card`;
  
  const currentUrl = view === 'stories' ? storiesUrl : cardUrl;

  const handleCopy = async () => {
    try {
      const fullUrl = `${window.location.origin}${currentUrl}`;
      await navigator.clipboard.writeText(fullUrl);
      setIsOldVisible(true);
      setTimeout(() => setIsOldVisible(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `My ${month} Mission Recap`,
          text: 'Check out my flight stats on Cemrosta!',
          url: `${window.location.origin}${currentUrl}`,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-bg/95 backdrop-blur-xl"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-5xl bg-surface border border-border rounded-[3rem] overflow-hidden shadow-2xl relative z-10 flex flex-col md:flex-row"
          >
            {/* Left: Preview */}
            <div className="flex-1 bg-bg/50 p-8 md:p-12 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-border min-h-[400px]">
               <div className="flex items-center gap-3 mb-8 bg-surface p-1 rounded-full border border-border">
                  <button 
                    onClick={() => setView('stories')}
                    className={`px-6 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${view === 'stories' ? 'bg-accent text-accent-fg shadow-lg' : 'text-text-muted hover:text-text'}`}
                  >
                    <Smartphone size={14} /> Stories
                  </button>
                  <button 
                    onClick={() => setView('card')}
                    className={`px-6 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${view === 'card' ? 'bg-accent text-accent-fg shadow-lg' : 'text-text-muted hover:text-text'}`}
                  >
                    <Monitor size={14} /> Card
                  </button>
               </div>

               <div className={`relative bg-surface rounded-2xl overflow-hidden shadow-2xl border border-border transition-all duration-500 ${view === 'stories' ? 'aspect-[9/16] h-[500px]' : 'aspect-[1.91/1] w-full max-w-md'}`}>
                  <img 
                    src={currentUrl} 
                    alt="Recap Preview" 
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
               </div>
            </div>

            {/* Right: Actions */}
            <div className="w-full md:w-[380px] p-8 md:p-12 flex flex-col">
              <div className="flex justify-between items-center mb-10">
                <div className="flex flex-col gap-1">
                  <div className="w-8 h-1 bg-accent/30" />
                  <div className="w-8 h-2 bg-accent/60" />
                  <div className="w-8 h-4 bg-accent" />
                </div>
                <button onClick={onClose} className="p-2 hover:bg-surface-2 rounded-full transition-colors text-text-muted hover:text-text">
                  <X size={24} />
                </button>
              </div>

              <h2 className="text-3xl font-bold tracking-tighter text-text mb-4">Share your mission.</h2>
              <p className="text-text-muted font-medium leading-relaxed mb-10">
                Your monthly highlights are ready for takeoff. Share your card to update your crew and family.
              </p>

              <div className="space-y-4 mt-auto">
                <a 
                  href={`${currentUrl}?download=1`}
                  className="w-full bg-accent text-accent-fg py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-xl shadow-accent/20 hover:bg-accent-hover transition-all"
                >
                  <Download size={20} strokeWidth={3} />
                  Download PNG
                </a>

                <button 
                  onClick={handleCopy}
                  className="w-full bg-surface border border-border text-text py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-surface-2 transition-all active:scale-95"
                >
                  {isCopied ? <Check size={20} className="text-success" /> : <Copy size={20} />}
                  {isCopied ? 'Copied Link' : 'Copy Link'}
                </button>

                {typeof navigator !== 'undefined' && !!navigator.share && (
                  <button 
                    onClick={handleShare}
                    className="w-full bg-surface border border-border text-text py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-surface-2 transition-all"
                  >
                    <Share2 size={20} />
                    Share Directly
                  </button>
                )}
              </div>

              <div className="mt-12 text-center">
                 <p className="text-[10px] font-bold text-text-subtle uppercase tracking-[0.4em] font-mono">
                   // CEMROSTA RECAP ENGINE
                 </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default RecapCardModal;
