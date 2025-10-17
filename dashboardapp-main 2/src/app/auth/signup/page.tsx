'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Logo } from '@/components/ui/Logo'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Button } from '@/components/ui/Button'
import { toast } from 'react-hot-toast'
import { Poppins } from 'next/font/google'
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/lib/firebase'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { updateProfile } from 'firebase/auth'
import { friendlyErrorMessage } from '@/lib/notifications'

const poppins = Poppins({ subsets: ['latin'], weight: ['600', '700'] })

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms)
    p.then((v) => { clearTimeout(t); resolve(v) }).catch((e) => { clearTimeout(t); reject(e) })
  })
}

export default function SignUpPage() {
  const { signUpEmail } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    solution: '',
    password: '',
    confirmPassword: ''
  })
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      // Backup to localStorage so we can recover if something goes wrong
      try {
        localStorage.setItem('pendingUserProfile', JSON.stringify({
          name: formData.name,
          email: formData.email,
          company: formData.company,
          solution: formData.solution,
        }))
      } catch (_) {}

      const cred = await signUpEmail(formData.email, formData.password)
      const uid = cred?.user?.uid

      try {
        if (cred?.user && formData.name) {
          await updateProfile(cred.user, { displayName: formData.name })
        }
      } catch (_) {}

      if (uid) {
        // Ensure profile document is written before redirecting
        await setDoc(doc(db, 'users', uid), {
          name: formData.name,
          email: formData.email,
          company: formData.company,
          solution: formData.solution,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        try { localStorage.removeItem('pendingUserProfile') } catch (_) {}
      }

      toast.success('Account created successfully.')
      router.push('/')
    } catch (err: any) {
      toast.error(friendlyErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <Logo className="mx-auto h-12 w-auto mb-4" />
          <h2 className={`${poppins.className} text-3xl font-bold text-gray-900 mb-2`}>
            Create your account
          </h2>
        </div>

        <Card className="bg-white border border-gray-200 shadow-xl p-10 rounded-2xl">
          <form onSubmit={handleEmailSignUp} className="space-y-6">
            <div>
              <Label htmlFor="name" className="text-gray-900">Full name</Label>
              <div className="mt-1 relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A7 7 0 1118.879 4.996 7 7 0 015.12 17.804z" />
                  </svg>
                </span>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="pl-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus-visible:ring-primary-500"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-gray-900">Email address</Label>
              <div className="mt-1 relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12H8m8-4H8m10 8H6a2 2 0 01-2-2V8a2 2 0 012-2h12a2 2 0 012 2v6a2 2 0 01-2 2z" />
                  </svg>
                </span>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus-visible:ring-primary-500"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="company" className="text-gray-900">Company</Label>
              <div className="mt-1 relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7l9-4 9 4-9 4-9-4zM21 10l-9 4-9-4M12 14v7" />
                  </svg>
                </span>
                <Input
                  id="company"
                  name="company"
                  type="text"
                  autoComplete="organization"
                  required
                  value={formData.company}
                  onChange={handleInputChange}
                  className="pl-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus-visible:ring-primary-500"
                  placeholder="Enter your company name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="solution" className="text-gray-900">Solution you're selling</Label>
              <div className="mt-1 relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 13h16M4 9h16M4 17h16" />
                  </svg>
                </span>
                <Input
                  id="solution"
                  name="solution"
                  type="text"
                  required
                  value={formData.solution}
                  onChange={handleInputChange}
                  className="pl-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus-visible:ring-primary-500"
                  placeholder="e.g., AI sales assistant, data enrichment, etc."
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-900">Password</Label>
              <div className="mt-1 relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c1.657 0 3-1.343 3-3V6a3 3 0 10-6 0v2c0 1.657 1.343 3 3 3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 11h14v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7z" />
                  </svg>
                </span>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus-visible:ring-primary-500"
                  placeholder="Create a password"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-gray-900">Confirm password</Label>
              <div className="mt-1 relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </span>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="pl-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus-visible:ring-primary-500"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary-600 hover:bg-primary-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/signin" className="font-medium text-primary-600 hover:text-primary-700">
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  )
}