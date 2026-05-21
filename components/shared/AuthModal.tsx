'use client';

import React, { useState } from 'react';
import { Mail, Lock, Loader2, AlertCircle, LogIn, UserPlus, KeyRound, CheckCircle2 } from 'lucide-react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Modal } from '@/components/shared/Modal';
import { useRouter } from 'next/navigation';

const TITLE_ID = 'auth-modal-title';

export const AuthModal = () => {
  const { isAuthModalOpen, closeAuthModal, authView, setAuthView } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const isLogin = authView === 'login';
  const isReset = authView === 'reset';

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message.replace('Firebase: ', '').replace(/ \(auth\/[^)]+\)/, ''));
    } finally {
      setIsLoading(false);
    }
  };

  const backToLogin = () => {
    setAuthView('login');
    setError(null);
    setResetSent(false);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        closeAuthModal();
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        closeAuthModal();
        router.push('/settings?onboarding=1');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message.replace('Firebase: ', '').replace(/ \(auth\/[^)]+\)/, ''));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      closeAuthModal();
      // Only redirect to settings on a truly new Google signup (no existing profile)
      // We detect this by checking if it's a new user via metadata
      const isNewUser = result.user.metadata.creationTime === result.user.metadata.lastSignInTime;
      if (isNewUser) {
        router.push('/settings?onboarding=1');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message.replace('Firebase: ', '').replace(/ \(auth\/[^)]+\)/, ''));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isAuthModalOpen}
      onClose={closeAuthModal}
      titleId={TITLE_ID}
      className="rounded-[var(--radius-xl)] p-10"
      hideCloseButton={false}
    >
      <div className="mb-8 mt-2">
        <div className="w-12 h-12 bg-accent-soft rounded-[var(--radius-lg)] flex items-center justify-center mb-6">
          {isReset
            ? <KeyRound className="text-accent" size={22} aria-hidden="true" />
            : isLogin
              ? <LogIn className="text-accent" size={22} aria-hidden="true" />
              : <UserPlus className="text-accent" size={22} aria-hidden="true" />}
        </div>
        <h2 id={TITLE_ID} className="text-[28px] font-black text-text leading-tight tracking-tighter">
          {isReset ? 'Reset password.' : isLogin ? 'Welcome back.' : 'Join the crew.'}
        </h2>
        <p className="text-text-muted font-bold text-[15px] mt-2">
          {isReset
            ? "Enter your email and we'll send you a reset link."
            : isLogin
              ? 'Sign in to your Otarosta account.'
              : 'Create an account to build your flight passport.'}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-[var(--radius-md)] bg-danger-soft border border-danger/20 flex items-start gap-3 text-[14px] text-danger"
        >
          <AlertCircle size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Reset password view ── */}
      {isReset && (
        resetSent ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <CheckCircle2 size={48} className="text-success" aria-hidden="true" />
            <p className="text-[15px] font-bold text-text">Check your inbox.</p>
            <p className="text-[14px] text-text-muted">
              A reset link has been sent to <span className="font-bold text-text">{email}</span>. Check your spam folder if it doesn&apos;t arrive in a minute.
            </p>
            <button onClick={backToLogin} className="mt-2 text-accent font-medium text-[14px] hover:underline underline-offset-4">
              Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4" noValidate>
            {error && (
              <div role="alert" className="mb-2 p-4 rounded-[var(--radius-md)] bg-danger-soft border border-danger/20 flex items-start gap-3 text-[14px] text-danger">
                <AlertCircle size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}
            <div>
              <label htmlFor="reset-email" className="sr-only">Email address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-subtle" size={16} aria-hidden="true" />
                <input
                  id="reset-email"
                  type="email"
                  placeholder="Email address"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface border border-border rounded-[var(--radius-md)] pl-10 pr-4 py-3 text-[15px] text-text placeholder:text-text-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent transition-colors"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-accent text-accent-fg rounded-[var(--radius-pill)] py-3 text-[15px] font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : 'Send reset link'}
            </button>
            <p className="text-center text-[13px] text-text-muted">
              <button type="button" onClick={backToLogin} className="text-accent font-medium hover:underline underline-offset-4">
                Back to sign in
              </button>
            </p>
          </form>
        )
      )}

      {/* ── Login / Signup view ── */}
      {!isReset && <form onSubmit={handleAuth} className="space-y-4" noValidate>
        <div>
          <label htmlFor="auth-email" className="sr-only">Email address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-subtle" size={16} aria-hidden="true" />
            <input
              id="auth-email"
              type="email"
              placeholder="Email address"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface border border-border rounded-[var(--radius-md)] pl-10 pr-4 py-3 text-[15px] text-text placeholder:text-text-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0 focus-visible:border-accent transition-colors"
            />
          </div>
        </div>
        <div>
          <label htmlFor="auth-password" className="sr-only">Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-subtle" size={16} aria-hidden="true" />
            <input
              id="auth-password"
              type="password"
              placeholder="Password"
              required
              minLength={6}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface border border-border rounded-[var(--radius-md)] pl-10 pr-4 py-3 text-[15px] text-text placeholder:text-text-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0 focus-visible:border-accent transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-accent text-accent-fg rounded-[var(--radius-pill)] py-3 text-[15px] font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading
            ? <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            : isLogin ? 'Sign in' : 'Create account'}
        </button>

        {isLogin && (
          <p className="text-center text-[13px] text-text-muted">
            <button
              type="button"
              onClick={() => { setAuthView('reset'); setError(null); }}
              className="text-accent font-medium hover:underline underline-offset-4"
            >
              Forgot password?
            </button>
          </p>
        )}
      </form>}

      {!isReset && <div className="relative my-6" aria-hidden="true">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-bg px-3 text-[13px] text-text-muted">or</span>
        </div>
      </div>}

      {!isReset && (
        <>
          <button
            onClick={handleGoogle}
            disabled={isLoading}
            className="w-full border border-border rounded-[var(--radius-pill)] py-3 text-[15px] text-text hover:bg-surface transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
          >
            Continue with Google
          </button>

          <p className="mt-6 text-center text-[13px] text-text-muted">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={() => { setAuthView(isLogin ? 'signup' : 'login'); setError(null); }}
              className="text-accent font-medium hover:underline underline-offset-4"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </>
      )}
    </Modal>
  );
};
