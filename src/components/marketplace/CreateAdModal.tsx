'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Plus, Loader2, Camera, Trash2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/utils/supabase';
import { useAuthStore } from '@/store/useAuthStore';

const CreateAdModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState('New');
  const [category, setCategory] = useState('Headsets');
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 5) {
      alert("Max 5 photos allowed");
      return;
    }

    // Create previews and store files
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImages(prev => [...prev, ...files]);
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    // Revoke the URL to prevent memory leaks
    URL.revokeObjectURL(previews[index]);
    
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setStatus({ type: 'error', text: 'You must be logged in to sell items.' });
      return;
    }

    setIsUploading(true);
    setStatus(null);

    try {
      const uploadedUrls: string[] = [];

      // 1. Upload Images to Supabase Storage
      for (const file of images) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('marketplace-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('marketplace-images')
          .getPublicUrl(filePath);
        
        uploadedUrls.push(publicUrl);
      }

      // 2. Save Listing to Database
      const { error: dbError } = await supabase
        .from('marketplace_listings')
        .insert({
          seller_id: user.id,
          title,
          description,
          price: parseFloat(price),
          condition,
          category,
          image_urls: uploadedUrls,
          status: 'available'
        });

      if (dbError) throw dbError;

      setStatus({ type: 'success', text: 'Your gear is now live on the marketplace!' });
      
      // Reset form after success
      setTimeout(() => {
        onClose();
        resetForm();
      }, 2000);

    } catch (err: any) {
      setStatus({ type: 'error', text: err.message || 'Failed to post listing.' });
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPrice('');
    setCondition('New');
    setCategory('Headsets');
    setImages([]);
    setPreviews([]);
    setStatus(null);
  };

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

          {status && (
            <div className={`mb-8 p-5 rounded-2xl flex items-center gap-3 text-sm font-bold border ${
              status.type === 'success' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
            }`}>
              {status.type === 'success' ? <CheckCircle2 size={20} /> : <Trash2 size={20} />}
              <p>{status.text}</p>
            </div>
          )}

          <form className="space-y-8" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Item Details</label>
              <input 
                type="text" 
                required
                placeholder="What are you selling? (e.g. Bose A20 Headset)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 p-5 rounded-2xl font-bold placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-rausch/20 focus:bg-white transition-all text-gray-900"
              />
              <textarea 
                placeholder="Tell us about the condition and key features..."
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 p-5 rounded-2xl font-bold placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-rausch/20 focus:bg-white transition-all text-gray-900"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Price (RM)</label>
                <input 
                  type="number" 
                  required
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 p-5 rounded-2xl font-bold focus:outline-none transition-all text-gray-900"
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Category</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 p-5 rounded-2xl font-bold focus:outline-none appearance-none text-gray-900"
                >
                   <option>Headsets</option>
                   <option>Luggage</option>
                   <option>Watches</option>
                   <option>Uniforms</option>
                   <option>Manuals</option>
                </select>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Condition</label>
                <select 
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 p-5 rounded-2xl font-bold focus:outline-none appearance-none text-gray-900"
                >
                   <option>New</option>
                   <option>Lightly Used</option>
                   <option>Well Used</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Photos (Max 5)</label>
              
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                {previews.map((src, i) => (
                  <div key={i} className="aspect-square rounded-2xl overflow-hidden relative group border border-gray-100">
                    <img src={src} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute inset-0 bg-rausch/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
                
                {images.length < 5 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 hover:border-rausch/50 hover:bg-gray-50 transition-all text-gray-400 hover:text-rausch"
                  >
                    <Plus size={24} />
                    <span className="text-[10px] font-black uppercase">Add</span>
                  </button>
                )}
              </div>
              
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                multiple
                className="hidden"
              />
            </div>

            <button 
              type="submit"
              disabled={isUploading || !title || !price || images.length === 0}
              className="w-full bg-black text-white py-6 rounded-2xl font-black text-lg hover:bg-gray-800 transition-all active:scale-[0.98] shadow-xl disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
            >
              {isUploading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Uploading your gear...
                </>
              ) : (
                'Post your listing'
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CreateAdModal;
