'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, Hexagon, ChevronRight, MessageCircle, ShieldCheck, Tag, Info } from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: string;
  category: string;
  image_urls: string[];
  seller_id: string;
  profiles?: {
    full_name: string;
    avatar_url: string;
    rank: string;
  };
}

const ListingDetailModal = ({ listing, isOpen, onClose }: { listing: Listing | null, isOpen: boolean, onClose: () => void }) => {
  const [currentImg, setCurrentImg] = React.useState(0);

  // Reset image index when listing changes
  React.useEffect(() => {
    setCurrentImg(0);
  }, [listing?.id]);

  const images = (listing.image_urls && listing.image_urls.length > 0) 
    ? listing.image_urls 
    : ["https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800"];

  return (
    <AnimatePresence>
      {isOpen && listing && (
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
            className="bg-white w-full max-w-5xl md:rounded-[3rem] relative z-10 shadow-2xl overflow-hidden flex flex-col md:flex-row h-full md:h-[80vh]"
          >
          <button 
            onClick={onClose} 
            className="absolute top-6 right-6 z-50 p-3 bg-white/90 backdrop-blur-md hover:bg-white rounded-full transition-all shadow-xl border border-gray-100"
          >
            <X size={20} className="text-gray-900" />
          </button>

          {/* Left: Image Carousel */}
          <div className="w-full md:w-3/5 bg-gray-100 relative group h-1/2 md:h-full">
            <img 
              src={images[currentImg]} 
              alt={listing.title} 
              className="w-full h-full object-cover"
            />
            
            {images.length > 1 && (
              <>
                <button 
                  onClick={() => setCurrentImg(prev => (prev > 0 ? prev - 1 : images.length - 1))}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronLeft size={24} />
                </button>
                <button 
                  onClick={() => setCurrentImg(prev => (prev < images.length - 1 ? prev + 1 : 0))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronRight size={24} />
                </button>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                   {images.map((_, i) => (
                     <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === currentImg ? 'bg-white w-6' : 'bg-white/40'}`} />
                   ))}
                </div>
              </>
            )}
          </div>

          {/* Right: Details Section */}
          <div className="w-full md:w-2/5 p-8 md:p-12 overflow-y-auto no-scrollbar flex flex-col">
            <div className="mb-8">
               <div className="flex items-center gap-2 mb-4">
                  <span className="bg-rausch/10 text-rausch px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-rausch/10">
                    {listing.category}
                  </span>
                  <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-gray-200">
                    {listing.condition}
                  </span>
               </div>
               <h2 className="text-3xl font-black text-gray-900 leading-tight mb-2">{listing.title}</h2>
               <p className="text-4xl font-black text-rausch tracking-tighter">RM{listing.price}</p>
            </div>

            <div className="prose prose-sm text-gray-500 font-medium leading-relaxed mb-10">
               <p>{listing.description || "No description provided."}</p>
            </div>

            <div className="space-y-6 mt-auto">
               {/* Seller Info Card */}
               <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden ring-4 ring-white shadow-sm">
                     <img 
                       src={listing.profiles?.avatar_url || `https://i.pravatar.cc/150?u=${listing.seller_id}`} 
                       alt="Seller" 
                       className="w-full h-full object-cover" 
                     />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Verified Seller</p>
                    <p className="font-bold text-gray-900">{listing.profiles?.full_name || "Crew Member"}</p>
                  </div>
                  <ShieldCheck className="ml-auto text-blue-500" size={20} />
               </div>

               <button className="w-full bg-black text-white py-6 rounded-2xl font-black text-lg hover:bg-gray-800 transition-all active:scale-[0.98] shadow-xl flex items-center justify-center gap-3">
                  <MessageCircle size={22} />
                  Message Seller
               </button>
               
               <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  Secure transaction via Cemrosta Pay
               </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ListingDetailModal;
