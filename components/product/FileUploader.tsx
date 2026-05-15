'use client';

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2, AlertCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoster } from '@/lib/contexts/RosterContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { parseRoster } from '@/lib/actions/parseRoster';

const FileUploader = () => {
  const { isLoading, setLoading, error, setError, setRoster } = useRoster();
  const { user } = useAuth();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setError(null);
    setLoading(true);
    
    // Create FormData for the Server Action
    const formData = new FormData();
    formData.append('file', file);
    if (user?.id) {
      formData.append('userId', user.id);
    }

    try {
      const result = await parseRoster(formData);
      setRoster(result);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to parse roster');
      setLoading(false);
    }
  }, [setLoading, setError, setRoster]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    multiple: false,
    disabled: isLoading,
  });

  return (
    <div className="max-w-2xl mx-auto px-4">
      <div {...getRootProps()}>
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className={`
            relative cursor-pointer rounded-3xl border-2 border-dashed transition-all duration-300
            p-12 flex flex-col items-center justify-center gap-4
            ${isDragActive ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50 hover:bg-surface'}
            ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          <div className={`
            w-16 h-16 rounded-2xl flex items-center justify-center transition-colors
            ${isDragActive ? 'bg-accent text-white' : 'bg-surface-2 text-text-subtle'}
          `}>
            {isLoading ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <Upload className="w-8 h-8" />
            )}
          </div>

          <div className="text-center">
            <p className="text-xl font-semibold text-text">
              {isLoading ? 'Parsing your roster...' : 'Drop your roster PDF here'}
            </p>
            <p className="text-text-muted mt-1">
              {isLoading ? 'Hold tight, we\'re decoding the flight data' : 'or click to browse from your computer'}
            </p>
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-text-subtle bg-surface px-4 py-2 rounded-full">
            <FileText className="w-3 h-3" />
            PDF ROSTERS ONLY
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mt-6 p-4 bg-danger/10 border border-danger/20 rounded-2xl flex items-center gap-3 text-danger"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div className="flex-1 text-sm font-medium">{error}</div>
            <button 
              onClick={() => setError(null)}
              className="p-1 hover:bg-danger/10 rounded-lg transition-colors"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileUploader;
