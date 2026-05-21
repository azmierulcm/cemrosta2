'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { User, onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase/client'

export interface Profile {
  id: string
  full_name?: string
  rank?: string
  airline?: string
  fleet?: string
  base?: string
  bio?: string
  avatar_url?: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  isAuthModalOpen: boolean
  authView: 'login' | 'signup' | 'reset'
  setProfile: (profile: Profile | null) => void
  openAuthModal: (view?: 'login' | 'signup') => void
  closeAuthModal: () => void
  setAuthView: (view: 'login' | 'signup' | 'reset') => void
  signOutUser: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authView, setAuthView] = useState<'login' | 'signup' | 'reset'>('signup')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      // Unblock the UI as soon as auth state is known — don't wait for
      // the profile fetch. If getDoc throws or hangs, setIsLoading(false)
      // would never run and the spinner would be stuck forever.
      setIsLoading(false)

      if (firebaseUser) {
        try {
          // Use the API route (Admin SDK) so Firestore security rules
          // don't block the read — same approach as writing the profile.
          const token = await firebaseUser.getIdToken()
          const res = await fetch('/api/profile', {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (res.ok) {
            const json = await res.json()
            if (json.exists && json.data) {
              setProfile({ id: firebaseUser.uid, ...json.data } as Profile)
            }
          }
        } catch {
          // Profile unavailable — proceed without it, fallbacks handle display
        }
      } else {
        setProfile(null)
      }
    })
    return unsubscribe
  }, [])

  const openAuthModal = (view: 'login' | 'signup' = 'signup') => {
    setAuthView(view)
    setIsAuthModalOpen(true)
  }
  const closeAuthModal = () => setIsAuthModalOpen(false)
  const signOutUser = () => signOut(auth).then(() => {
    window.location.href = '/demo';
  })

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAuthModalOpen,
        authView,
        setProfile,
        openAuthModal,
        closeAuthModal,
        setAuthView,
        signOutUser,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
