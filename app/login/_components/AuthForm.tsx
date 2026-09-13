'use client'

import React, { useState, useTransition, useActionState } from 'react'
import Link from 'next/link'
import { sendEmailOtp, verifyEmailOtp, login, type AuthResult } from '@/actions/auth'
import { Loader2, User, Mail, ArrowRight, KeyRound, Check, Phone, Lock, Eye, EyeOff } from 'lucide-react'

export default function AuthForm({ redirectTo }: { redirectTo?: string }) {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN')
  const [showPassword, setShowPassword] = useState(false)

  // --- Password login (LOGIN mode) ---
  const [loginState, loginAction, loginPending] = useActionState<AuthResult, FormData>(login, {})

  // --- OTP registration flow (REGISTER mode) ---
  const [otpSent, setOtpSent] = useState(false)
  const [otpEmail, setOtpEmail] = useState('')
  const [otpFullName, setOtpFullName] = useState('')
  const [otpPhone, setOtpPhone] = useState('')
  const [otpPassword, setOtpPassword] = useState('')
  const [otpCode, setOtpCode] = useState('')

  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [resendTimer, setResendTimer] = useState(0)

  // Countdown timer for resending OTP
  React.useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => prev - 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [resendTimer])

  // Send OTP handler (registration only)
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!otpEmail) {
      setError('Please enter a valid email address.')
      return
    }
    if (!otpFullName) {
      setError('Please enter your full name.')
      return
    }
    if (!otpPassword || otpPassword.length < 6) {
      setError('Please enter a password of at least 6 characters.')
      return
    }

    startTransition(async () => {
      const res = await sendEmailOtp(otpEmail, 'REGISTER', otpFullName)
      if (res?.error) {
        setError(res.error)
      } else {
        setOtpSent(true)
        setResendTimer(60)
        setSuccess(`A 6-digit verification code has been sent to ${otpEmail}`)
      }
    })
  }

  // Verify OTP handler (registration only)
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter a valid 6-digit code.')
      return
    }

    startTransition(async () => {
      const res = await verifyEmailOtp(otpEmail, otpCode, redirectTo, otpFullName, otpPhone, otpPassword)
      if (res?.error) {
        setError(res.error)
      }
    })
  }

  return (
    <div className="space-y-6 animate-fade-in ">
      {/* Alert Messages (registration flow) */}
      {mode === 'REGISTER' && error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-start gap-2">
          <span className="font-semibold mt-0.5">Oops!</span>
          <p>{error}</p>
        </div>
      )}

      {mode === 'REGISTER' && success && (
        <div className="p-3 bg-green-50 text-green-700 rounded-xl text-sm border border-green-100 flex items-start gap-2">
          <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>{success}</p>
        </div>
      )}

      {mode === 'LOGIN' ? (
        /* --- Email + Password Login --- */
        <form action={loginAction} className="space-y-4">
          <input type="hidden" name="redirect_to" value={redirectTo || ''} />

          {loginState?.error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-start gap-2">
              <span className="font-semibold mt-0.5">Oops!</span>
              <p>{loginState.error}</p>
            </div>
          )}

          <div>
            <label htmlFor="login_email" className="block text-sm font-medium text-ink/70 mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                id="login_email"
                name="email"
                type="email"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-cream-line bg-cream focus:outline-none focus:border-gold transition-colors"
                placeholder="you@example.com"
              />
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink/40" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="login_password" className="block text-sm font-medium text-ink/70">
                Password
              </label>
              <Link href="/forgot-password" className="text-xs text-gold hover:underline font-semibold">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="login_password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full pl-10 pr-11 py-3 rounded-xl border border-cream-line bg-cream focus:outline-none focus:border-gold transition-colors"
                placeholder="Your password"
              />
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink/40" />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-gold transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loginPending}
            className="w-full py-3.5 px-4 bg-[#0A0A0A] hover:bg-[#D4AF37] text-white hover:text-black border border-gold/40 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2 shadow-md"
          >
            {loginPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Login <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      ) : (
        /* --- OTP Registration Flow --- */
        <div className="space-y-4">
          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label htmlFor="otp_name" className="block text-sm font-medium text-ink/70 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    id="otp_name"
                    type="text"
                    required
                    value={otpFullName}
                    onChange={(e) => setOtpFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-cream-line bg-cream focus:outline-none focus:border-gold transition-colors"
                    placeholder="Ayesha Khan"
                  />
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink/40" />
                </div>
              </div>

              <div>
                <label htmlFor="otp_phone" className="block text-sm font-medium text-ink/70 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <input
                    id="otp_phone"
                    type="text"
                    required
                    maxLength={10}
                    pattern="\d{10}"
                    title="Please enter exactly 10 digits"
                    value={otpPhone}
                    onChange={(e) => setOtpPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-cream-line bg-cream focus:outline-none focus:border-gold transition-colors"
                    placeholder="9876543210"
                  />
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink/40" />
                </div>
              </div>

              <div>
                <label htmlFor="otp_email" className="block text-sm font-medium text-ink/70 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="otp_email"
                    type="email"
                    required
                    value={otpEmail}
                    onChange={(e) => setOtpEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-cream-line bg-cream focus:outline-none focus:border-gold transition-colors"
                    placeholder="you@example.com"
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink/40" />
                </div>
              </div>

              <div>
                <label htmlFor="otp_password" className="block text-sm font-medium text-ink/70 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="otp_password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={otpPassword}
                    onChange={(e) => setOtpPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-cream-line bg-cream focus:outline-none focus:border-gold transition-colors"
                    placeholder="Min. 6 characters"
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink/40" />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-gold transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={pending}
                className="w-full py-3.5 px-4 bg-[#0A0A0A] hover:bg-[#D4AF37] text-white hover:text-black border border-gold/40 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2 shadow-md"
              >
                {pending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Send Registration OTP
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="otp_code" className="block text-sm font-medium text-ink/70">
                    Enter Verification Code
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false)
                      setError('')
                      setSuccess('')
                    }}
                    className="text-xs text-gold hover:underline font-semibold"
                  >
                    Change Email
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="otp_code"
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-10 pr-4 py-3 tracking-widest text-center text-lg font-bold rounded-xl border border-cream-line bg-cream focus:outline-none focus:border-gold transition-colors"
                    placeholder="123456"
                  />
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink/40" />
                </div>
              </div>

              <button
                type="submit"
                disabled={pending}
                className="w-full py-3.5 px-4 bg-[#0A0A0A] hover:bg-[#D4AF37] text-white hover:text-black border border-gold/40 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2 shadow-md"
              >
                {pending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Verify & Create Account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center mt-2">
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={pending || resendTimer > 0}
                  className="text-xs text-ink/70 hover:text-gold transition-colors font-medium underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
                >
                  {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend verification code'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Switch mode links */}
      <div className="pt-4 border-t border-cream-line text-center">
        <p className="text-sm text-ink/70">
          {mode === 'LOGIN' ? "Don't have an account?" : 'Already have an account?'}
        </p>
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'LOGIN' ? 'REGISTER' : 'LOGIN')
            setOtpSent(false)
            setError('')
            setSuccess('')
          }}
          className="mt-1 font-semibold text-ink hover:text-gold transition-colors underline underline-offset-4 font-body"
        >
          {mode === 'LOGIN' ? 'Create an Account' : 'Login Here'}
        </button>
      </div>
    </div>
  )
}
