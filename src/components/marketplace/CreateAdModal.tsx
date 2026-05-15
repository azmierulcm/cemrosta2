'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Plus } from 'lucide-react';

const CreateAdModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white w-full max-w-2xl rounded-[2.5rem] p-10 relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          <button onClick={onClose} className="absolute top-8 right-8 p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>

          <h2 className="text-3xl font-black text-gray-900 mb-2">Sell your gear</h2>
          <p className="text-gray-500 font-medium mb-10 text-lg">Turn your unused items into extra travel cash.</p>

          <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Item Details</label>
              <input 
                type="text" 
                placeholder="What are you selling?"
                className="w-full bg-gray-50 border border-gray-100 p-5 rounded-2xl font-bold placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-rausch/20 focus:bg-white transition-all"
              />
              <textarea 
                placeholder="Tell us about the condition and key features..."
                rows={4}
                className="w-full bg-gray-50 border border-gray-100 p-5 rounded-2xl font-bold placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-rausch/20 focus:bg-white transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Price (RM)</label>
                <input 
                  type="number" 
                  placeholder="0.00"
                  className="w-full bg-gray-50 border border-gray-100 p-5 rounded-2xl font-bold focus:outline-none transition-all"
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Condition</label>
                <select className="w-full bg-gray-50 border border-gray-100 p-5 rounded-2xl font-bold focus:outline-none appearance-none">
                   <option>New</option>
                   <option>Lightly Used</option>
                   <option>Well Used</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Photos</label>
              <div className="border-2 border-dashed border-gray-200 rounded-[2rem] p-12 text-center hover:border-rausch/50 transition-colors cursor-pointer group bg-gray-50/50">
                 <Upload className="w-10 h-10 text-gray-300 mx-auto mb-4 group-hover:text-rausch transition-colors" />
                 <p className="text-gray-900 font-bold">Drop images or click to upload</p>
                 <p className="text-gray-400 text-xs font-medium mt-1">Up to 5 photos, max 10MB each</p>
              </div>
            </div>

            <button className="w-full bg-black text-white py-6 rounded-2xl font-black text-lg hover:bg-gray-800 transition-all active:scale-[0.98] shadow-xl">
              Post your listing
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CreateAdModal;
