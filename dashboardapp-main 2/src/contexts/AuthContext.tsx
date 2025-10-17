"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { auth, googleProvider, microsoftProvider } from '@/lib/firebase'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User as FirebaseUser,
  UserCredential,
} from 'firebase/auth'

interface AuthContextType {
  user: FirebaseUser | null
  loading: boolean
  signInEmail: (email: string, password: string) => Promise<void>
  signUpEmail: (email: string, password: string) => Promise<UserCredential>
  signInGoogle: () => Promise<void>
  signInMicrosoft: () => Promise<void>
  signOutUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const signInEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signUpEmail = async (email: string, password: string) => {
    return await createUserWithEmailAndPassword(auth, email, password)
  }

  const signInGoogle = async () => {
    await signInWithPopup(auth, googleProvider)
  }

  const signInMicrosoft = async () => {
    await signInWithPopup(auth, microsoftProvider)
  }

  const signOutUser = async () => {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, signInEmail, signUpEmail, signInGoogle, signInMicrosoft, signOutUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
