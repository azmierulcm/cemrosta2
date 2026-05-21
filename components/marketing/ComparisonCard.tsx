'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';

interface ComparisonCardProps {
  type: 'old' | 'new';
  title: string;
  content: string;
}

const ComparisonCard = ({ type, content }: ComparisonCardProps) => {
  const isOld = type === 'old';
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={`p-8 rounded-[2rem] border h-full ${
        isOld 
          ? 'bg-surface border-border text-text-muted' 
          : 'bg-bg border-accent/20 shadow-xl shadow-accent/5 text-text'
      }`}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-6 ${
        isOld ? 'bg-gray-200 text-text-subtle' : 'bg-accent text-white'
      }`}>
        {isOld ? <X size={20} /> : <Check size={20} />}
      </div>
      <h4 className={`text-lg font-bold mb-4 uppercase tracking-tight ${isOld ? 'text-text-subtle' : 'text-accent'}`}>
        {isOld ? 'The Old Way' : 'The Cemrosta Way'}
      </h4>
      <p className={`text-xl font-bold leading-snug ${isOld ? 'text-text-subtle' : 'text-text'}`}>
        {content}
      </p>
    </motion.div>
  );
};

export default ComparisonCard;
