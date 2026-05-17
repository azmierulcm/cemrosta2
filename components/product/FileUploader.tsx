'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2, AlertCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useRoster } from '@/lib/contexts/RosterContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { parseRosterPreview, saveConfirmedRoster } from '@/lib/actions/parseRoster';
import { RosterConfirmModal } from '@/components/product/RosterConfirmModal';
import type { RosterData } from '@/lib/types';

interface FileUploaderProps {
  onSuccess?: () => void;
}

export const FileUploader = ({ onSuccess }: FileUploaderProps) => {
  const shouldReduceMotion = useReducedMotion();
  const { error, setError, setRoster } = useRoster();
  const { user } = useAuth();
  const userId = user?.uid;

  const [previewData, setPreviewData] = useState<RosterData | null>(null);
  const [savedRosterId, setSavedRosterId] = useState<string | null>(null);
  // Local states so parse/save don't touch the shared RosterContext isLoading,
  // which would cause HomeClient to unmount this component mid-request.
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const classifyError = (err: unknown): string => {
    const msg = err instanceof Error ? err.message : String(err);
    const lower = msg.toLowerCase();
    // Surface specific messages from the server action directly
    if (
      lower.includes('text-based') ||
      lower.includes('image-based') ||
      lower.includes('blank or image') ||
      lower.includes('could not read this pdf')
    ) {
      return msg; // already user-friendly
    }
    if (lower.includes('no duties') || lower.includes('no duties were found')) {
      return msg;
    }
    if (lower.includes('parsed successfully but could not be saved')) {
      return msg;
    }
    if (lower.includes('could not recognise') || lower.includes('not yet supported')) {
      return msg;
    }
    if (lower.includes('no dates found')) {
      return 'No dates were found in this PDF. Make sure it is a Malaysia Airlines AIMS roster — not a scanned image or a different format.';
    }
    if (lower.includes('not a pdf') || lower.includes('invalid pdf') || lower.includes('unsupported')) {
      return 'This file isn\'t a valid PDF. Please export your AIMS roster as a PDF and try again.';
    }
    if (lower.includes('no flights') || lower.includes('no events') || lower.includes('could not parse') || lower.includes('empty')) {
      return 'No flights found in this PDF. Make sure it\'s a Malaysia Airlines AIMS roster, not a scanned image.';
    }
    if (lower.includes('network') || lower.includes('fetch') || lower.includes('failed to fetch') || lower.includes('abort') || lower.includes('timed out') || lower.includes('timeout')) {
      return 'The request timed out. Your PDF may be too large — try a single-month roster and upload again.';
    }
    if (lower.includes('too large') || lower.includes('size')) {
      return 'This PDF is too large. Try a single-month roster file instead.';
    }
    if (lower.includes('password') || lower.includes('encrypted')) {
      return 'This PDF is password-protected. Please remove the password before uploading.';
    }
    if (lower.includes('permission') || lower.includes('unauthenticated')) {
      return 'You need to be signed in to save a roster.';
    }
    // Last resort: show the raw message so it's debuggable
    return msg || 'Something went wrong parsing your roster. Try a different month\'s PDF or contact support.';
  };

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: import('react-dropzone').FileRejection[]) => {
    if (rejectedFiles.length > 0) {
      setError('Only PDF files are supported. Please export your AIMS roster as a PDF.');
      return;
    }

    const file = acceptedFiles[0];
    if (!file) return;

    setError(null);
    setPreviewData(null);
    setSavedRosterId(null);
    setIsParsing(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const result = await parseRosterPreview(formData);
      if (!result) {
        throw new Error('Request timed out — no response from server.');
      }
      setPreviewData(result);
    } catch (err: unknown) {
      setError(classifyError(err));
    } finally {
      setIsParsing(false);
    }
  }, [setError]);

  const handleConfirm = async () => {
    if (!previewData || !userId) return;
    setIsSaving(true);
    try {
      const { rosterId } = await saveConfirmedRoster(userId, previewData);
      setSavedRosterId(rosterId);
    } catch (err) {
      setError(classifyError(err));
      setPreviewData(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDone = () => {
    if (previewData && savedRosterId) {
      setRoster(previewData, savedRosterId);
    }
    setPreviewData(null);
    setSavedRosterId(null);
    onSuccess?.();
  };

  const handleReupload = () => {
    setPreviewData(null);
    setSavedRosterId(null);
    setError(null);
  };

  const isBusy = isParsing || isSaving;

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    disabled: isBusy,
  });

  const modalOpen = Boolean(previewData) || Boolean(savedRosterId);

  return (
    <div className="max-w-2xl mx-auto px-4">
      <div {...getRootProps()}>
        <motion.div
          whileHover={shouldReduceMotion ? {} : { scale: 1.01 }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.99 }}
          className={`
            relative cursor-pointer rounded-[2.5rem] border-2 border-dashed transition-all duration-300
            p-14 flex flex-col items-center justify-center gap-6
            ${isDragActive ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/40 hover:bg-surface-2'}
            ${isBusy ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />

          <div className={`
            w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-500
            ${isDragActive ? 'bg-accent text-white shadow-xl shadow-accent/20' : 'bg-surface-2 text-text-subtle border border-border'}
          `}>
            {isBusy ? (
              <Loader2 className="w-10 h-10 animate-spin" />
            ) : (
              <Upload className="w-10 h-10" strokeWidth={2.5} />
            )}
          </div>

          <div className="text-center">
            <p className="text-2xl font-bold text-text tracking-tight">
              {isBusy ? 'Parsing your mission...' : 'Drop your roster PDF here'}
            </p>
            <p className="text-text-muted mt-2 font-bold tracking-tight">
              {isBusy ? "Hold tight, we're decoding the flight data" : 'or click to browse from your computer'}
            </p>
          </div>

          <div className="mt-6 flex items-center gap-2 text-[10px] font-black text-text-subtle bg-surface-2 border border-border px-5 py-2.5 rounded-full font-mono uppercase tracking-[0.2em]">
            <FileText className="w-4 h-4 text-accent" />
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
            role="alert"
            className="mt-8 p-6 bg-danger/5 border border-danger/10 rounded-[2rem] flex items-center gap-4 text-danger shadow-sm"
          >
            <AlertCircle className="w-6 h-6 shrink-0" />
            <div className="flex-1 text-sm font-bold tracking-tight">{error}</div>
            <button
              onClick={() => setError(null)}
              aria-label="Dismiss error"
              className="p-2 hover:bg-danger/10 rounded-xl transition-colors"
            >
              <XCircle className="w-5 h-5" aria-hidden="true" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <RosterConfirmModal
        isOpen={modalOpen}
        previewData={previewData}
        isSaving={isSaving}
        savedRosterId={savedRosterId}
        onConfirm={handleConfirm}
        onReupload={handleReupload}
        onDone={handleDone}
      />
    </div>
  );
};
