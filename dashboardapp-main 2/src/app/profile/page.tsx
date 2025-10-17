'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { mockUser } from '@/lib/mockData'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { Logo } from '@/components/ui/Logo'
import { toast } from 'react-hot-toast'
// Removed avatar UI
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword, updateProfile as updateAuthProfile } from 'firebase/auth'
import { friendlyErrorMessage } from '@/lib/notifications'

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    company: '',
    solution: '',
    dateOfBirth: '',
    avatar: '',
  })
  // Avatar changes disabled: no local pending file state
  const [hydrated, setHydrated] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    const load = async () => {
      if (loading) return
      if (!user) {
        router.replace('/auth/signin')
        return
      }
      let base = {
        name: user.displayName ?? '',
        email: user.email ?? '',
        company: '',
        solution: '',
        dateOfBirth: '',
        avatar: user.photoURL ?? '',
      }
      try {
        const snap = await getDoc(doc(db, 'users', user.uid))
        if (snap.exists()) {
          const data = snap.data() as any;
          base = {
            name: data.name ?? base.name,
            email: data.email ?? base.email,
            company: data.company ?? '',
            solution: data.solution ?? '',
            dateOfBirth: data.dateOfBirth ?? '',
            avatar: (data.image as string) || (data.imageData as string) || base.avatar,
          }
        } else {
          // Repair from local backup if we have it
          try {
            const raw = localStorage.getItem('pendingUserProfile')
            if (raw) {
              const pending = JSON.parse(raw)
              base = {
                name: pending.name ?? base.name,
                email: pending.email ?? base.email,
                company: pending.company ?? '',
                solution: pending.solution ?? '',
                dateOfBirth: base.dateOfBirth,
                avatar: base.avatar,
              }
              // Write back to Firestore
              await updateDoc(doc(db, 'users', user.uid), {
                name: base.name,
                email: base.email,
                company: base.company,
                solution: base.solution,
                updatedAt: serverTimestamp(),
              }).catch(async () => {
                // If update fails because doc doesn't exist, create it
                await setDoc(doc(db, 'users', user.uid), {
                  name: base.name,
                  email: base.email,
                  company: base.company,
                  solution: base.solution,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                })
              })
              localStorage.removeItem('pendingUserProfile')
            }
          } catch (_) {}
        }
      } catch (_) {}
      setProfileData(base)
      setHydrated(true)
    }
    load()
  }, [user, loading, router])

  if (!loading && !user) {
    // Do not render the profile page while redirecting
    return null
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (user) {
        // Update displayName in Auth if changed
        if (profileData.name && profileData.name !== user.displayName) {
          await updateAuthProfile(user, { displayName: profileData.name })
        }
        await setDoc(
          doc(db, 'users', user.uid),
          {
            name: profileData.name,
            company: profileData.company,
            solution: profileData.solution,
            dateOfBirth: profileData.dateOfBirth || null,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )
      }

      toast.success('Profile updated successfully!')
    } catch (e: any) {
      toast.error(friendlyErrorMessage(e))
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long')
      return
    }

    setIsPasswordLoading(true)
    try {
      // Reauthenticate with current password
      if (!user.email) throw new Error('Missing email on account')
      const cred = EmailAuthProvider.credential(user.email, passwordData.currentPassword)
      await reauthenticateWithCredential(user, cred)
      // Update password
      await updatePassword(user, passwordData.newPassword)
      toast.success('Password changed successfully!')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err: any) {
      toast.error("Password is wrong!")
    } finally {
      setIsPasswordLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (name.startsWith('profile_')) {
      const fieldName = name.replace('profile_', '')
      setProfileData(prev => ({
        ...prev,
        [fieldName]: value
      }))
    } else {
      setPasswordData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  // Avatar changes are disabled; no handler

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">Loading profile…</div>
    )
  }

  return (
    <div className="h-screen bg-white dark:bg-gray-900 flex flex-col">
      {/* Top Header Bar - Light theme with dark support */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          {/* Left side - Back button and title */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="h-6 w-6 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-gray-600 dark:text-gray-300">Profile</span>
              <span className="text-gray-400 dark:text-gray-500">/</span>
              <span className="text-gray-900 dark:text-gray-100 font-medium">Settings</span>
            </div>
          </div>

          {/* Right side - empty (theme toggle removed) */}
          <div className="flex items-center space-x-4" />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Information */}
          <Card>
            <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                    Profile Information
                  </h2>

              <form onSubmit={handleProfileSubmit} className="space-y-6">

                {/* Email Address - Display as text */}
                <div>
                  <Label>Email Address</Label>
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md">
                    <span className="text-gray-900 dark:text-gray-100 font-medium">{profileData.email}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Email address cannot be changed
                  </p>
                </div>

                {/* Username - Editable field */}
                <div>
                  <Label htmlFor="profile_name">Username</Label>
                  <Input
                    id="profile_name"
                    name="profile_name"
                    type="text"
                    value={profileData.name}
                    onChange={handleInputChange}
                    className="mt-1"
                    placeholder="Enter your username"
                  />
                </div>

                <div>
                  <Label htmlFor="profile_company">Company Name</Label>
                  <Input
                    id="profile_company"
                    name="profile_company"
                    type="text"
                    value={profileData.company}
                    onChange={handleInputChange}
                    placeholder="e.g., Acme Corp"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="profile_solution">Solution You Sell</Label>
                  <Textarea
                    id="profile_solution"
                    name="profile_solution"
                    value={profileData.solution}
                    onChange={handleInputChange}
                    placeholder="e.g., HR management software, cybersecurity solutions"
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="profile_dateOfBirth">Date of Birth</Label>
                  <Input
                    id="profile_dateOfBirth"
                    name="profile_dateOfBirth"
                    type="date"
                    value={profileData.dateOfBirth}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>

                <Button
                  type="submit"
                  isLoading={isLoading}
                  className="w-full"
                >
                  Update Profile
                </Button>
              </form>
            </div>
          </Card>

          {/* Password Change */}
          <Card>
            <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                    Change Password
                  </h2>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={handleInputChange}
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={handleInputChange}
                    className="mt-1"
                    required
                    minLength={8}
                  />
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Must be at least 8 characters long
                    </p>
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={handleInputChange}
                    className="mt-1"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  isLoading={isPasswordLoading}
                  disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                  className="w-full"
                >
                  Change Password
                </Button>
              </form>
            </div>
          </Card>
        </div>
        </div>
      </div>
    </div>
  )
}
