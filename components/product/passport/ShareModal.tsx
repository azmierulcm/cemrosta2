'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Download, Copy, Layout, Smartphone, Monitor } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  crewId: string;
}

type Format = 'story' | 'feed' | 'wide';
type Privacy = 'public' | 'crew' | 'family' | 'anonymous';

const ShareModal = ({ isOpen, onClose, crewId }: ShareModalProps) => {
  const [format, setFormat] = useState<Format>('story');
  const [privacy, setPrivacy] = useState<Privacy>('public');
  const [isCopying, setIsCopying] = useState(false);

  if (!isOpen) return null;

  const imageUrl = `/api/share/year-in-air/${crewId}?format=${format}&privacy=${privacy}`;

  const copyLink = () => {
    setIsCopying(true);
    navigator.clipboard.writeText(`${window.location.origin}/passport/demo`); // Placeholder
    setTimeout(() => setIsCopying(false), 2000);
  };

  const downloadImage = async () => {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Cemrosta-${format}-${new Date().getFullYear()}.png`;
    link.click();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
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
          className="bg-bg w-full max-w-6xl rounded-[2.5rem] flex flex-col md:flex-row overflow-hidden relative z-10 shadow-2xl h-[90vh] md:h-[80vh]"
        >
          <button onClick={onClose} className="absolute top-8 right-8 z-20 p-2 hover:bg-surface-2 rounded-full transition-colors">
            <X size={20} className="text-text-subtle" />
          </button>

          {/* Left: Interactive Preview */}
          <div className="w-full md:w-3/5 bg-gray-900 p-8 flex items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(#D4AF37 1px, transparent 0)', backgroundSize: '40px 40px' }} />
            </div>
            
            <div className={`
                relative shadow-2xl transition-all duration-500 overflow-hidden rounded-xl border border-white/10
                ${format === 'story' ? 'aspect-[9/16] h-full' : format === 'feed' ? 'aspect-[4/5] h-[90%]' : 'aspect-[16/9] w-full'}
            `}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Passport Card Preview"
                  className="w-full h-full object-cover"
                />
            </div>
          </div>

          {/* Right: Controls */}
          <div className="w-full md:w-2/5 p-10 flex flex-col overflow-y-auto no-scrollbar bg-bg">
            <div className="mb-10">
              <h2 className="text-3xl font-black text-text mb-2 leading-tight">Share your mission.</h2>
              <p className="text-text-muted font-medium italic">Ready for Stories, Feed, and LinkedIn.</p>
            </div>

            {/* Format Selection */}
            <div className="mb-10">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-subtle mb-4 block">Select Format</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'story', label: 'Story', icon: Smartphone },
                  { id: 'feed', label: 'Feed', icon: Layout },
                  { id: 'wide', label: 'Wide', icon: Monitor },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFormat(f.id as Format)}
                    className={`
                      flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all
                      ${format === f.id ? 'border-accent bg-accent/5 text-accent' : 'border-border text-text-subtle hover:border-border'}
                    `}
                  >
                    <f.icon size={20} />
                    <span className="text-xs font-bold">{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Privacy Toggles */}
            <div className="mb-12">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-subtle mb-4 block">Privacy Mode</label>
              <div className="space-y-2">
                {[
                  { id: 'public', label: 'Public', desc: 'Show full name and exact flight stats.' },
                  { id: 'crew', label: 'Crew only', desc: 'Hide exact dates, show aggregates only.' },
                  { id: 'family', label: 'Family', desc: 'Non-aviation terms and simpler city names.' },
                  { id: 'anonymous', label: 'Anonymous', desc: 'No name or handle. Perfect for forums.' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPrivacy(p.id as Privacy)}
                    className={`
                      w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4
                      ${privacy === p.id ? 'border-accent bg-accent/5' : 'border-border hover:border-border'}
                    `}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${privacy === p.id ? 'border-accent' : 'border-gray-300'}`}>
                      {privacy === p.id && <div className="w-2 h-2 rounded-full bg-accent" />}
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${privacy === p.id ? 'text-text' : 'text-text-muted'}`}>{p.label}</p>
                      <p className="text-[10px] text-text-subtle font-medium">{p.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-auto space-y-4">
              <button 
                onClick={downloadImage}
                className="w-full bg-black text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-gray-800 transition-all shadow-xl active:scale-95"
              >
                <Download size={20} />
                Save Image
              </button>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={copyLink}
                  className="bg-surface-2 text-text py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-200 transition-all active:scale-95"
                >
                  <Copy size={16} />
                  {isCopying ? 'Copied!' : 'Copy Link'}
                </button>
                <button className="bg-surface-2 text-text py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-200 transition-all active:scale-95">
                  <Share2 size={16} />
                  Share Social
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ShareModal;
