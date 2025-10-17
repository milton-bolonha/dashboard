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
import { friendlyErrorMessage } from '@/lib/notifications'

const poppins = Poppins({ subsets: ['latin'], weight: ['600', '700'] })

export default function SignInPage() {
  const { signInEmail, signInGoogle, signInMicrosoft } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await signInEmail(formData.email, formData.password)
      toast.success('Signed in successfully.')
      router.push('/')
    } catch (err: any) {
      console.error(err)
      toast.error(friendlyErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      await signInGoogle()
      toast.success('Signed in successfully.')
      router.push('/')
    } catch (err: any) {
      toast.error(friendlyErrorMessage(err))
    }
  }

  const handleMicrosoftSignIn = async () => {
    try {
      await signInMicrosoft()
      toast.success('Signed in successfully.')
      router.push('/')
    } catch (err: any) {
      toast.error(friendlyErrorMessage(err))
    }
  }

  const handleForgotPassword = () => {
    toast('Forgot password (mock)')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <Logo className="mx-auto h-12 w-auto mb-4" />
          <h2 className={`${poppins.className} text-3xl font-bold text-gray-900 mb-2`}>
            Signin
          </h2>
        </div>

        <Card className="bg-white border border-gray-200 shadow-xl p-10 rounded-2xl">
          <form onSubmit={handleEmailSignIn} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-gray-900">Email Address</Label>
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
                  placeholder="Enter Email Address"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-900">Your Password</Label>
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
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-10 pr-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus-visible:ring-primary-500"
                  placeholder="Enter Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7 0-1.045.41-2.058 1.125-2.975M21 12c0 1.24-.44 2.39-1.19 3.32M3 3l18 18M9.88 9.88A3 3 0 0012 15a3 3 0 002.12-5.12" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-gray-600">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 bg-white text-primary-600 focus:ring-primary-500"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <button type="button" onClick={handleForgotPassword} className="text-sm hover:text-gray-800">
                Forgot Password?
              </button>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary-600 hover:bg-primary-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* OAuth buttons */}
          <div className="mt-6 space-y-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              className="w-full bg-white hover:bg-gray-50 text-gray-900 border-gray-300"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign In with Google
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleMicrosoftSignIn}
              className="w-full bg-white hover:bg-gray-50 text-gray-900 border-gray-300"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#F25022" d="M1 1h10v10H1z"/>
                <path fill="#00A4EF" d="M13 1h10v10H13z"/>
                <path fill="#7FBA00" d="M1 13h10v10H1z"/>
                <path fill="#FFB900" d="M13 13h10v10H13z"/>
              </svg>
              Sign In with Microsoft
            </Button>
          </div>

          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="font-medium text-primary-600 hover:text-primary-700">
              Sign up
            </Link>
          </p>
        </Card>
      </div>
    </div>
  )
}