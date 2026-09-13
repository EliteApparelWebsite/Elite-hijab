'use client'

import { useActionState, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Lock, Eye, EyeOff, ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react'
import { resetPassword, type AuthResult } from '@/actions/auth'

export default function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const [state, formAction, pending] = useActionState<AuthResult, FormData>(resetPassword, {})
  const [showPassword, setShowPassword] = useState(false)

  if (state?.success) {
    return (
      <div className="space-y-6 animate-fade-in text-center">
        <div className="p-4 bg-green-50 text-green-700 rounded-xl text-sm border border-green-100 flex items-start gap-2 text-left">
          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>Your password has been changed successfully.</p>
        </div>
        <Link
          href="/login"
          className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 bg-[#0A0A0A] hover:bg-[#D4AF37] text-white hover:text-black border border-gold/40 rounded-xl font-semibold transition-all duration-300 shadow-md"
        >
          Log In
        </Link>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="space-y-6 animate-fade-in text-center">
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
          This reset link is missing or invalid. Please request a new one.
        </div>
        <Link href="/forgot-password" className="text-sm font-semibold text-ink hover:text-gold transition-colors underline underline-offset-4">
          Request a new link
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="token" value={token} />

        {state?.error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-start gap-2">
            <span className="font-semibold mt-0.5">Oops!</span>
            <p>{state.error}</p>
          </div>
        )}

        <div>
          <label htmlFor="rp_password" className="block text-sm font-medium text-ink/70 mb-1">
            New Password
          </label>
          <div className="relative">
            <input
              id="rp_password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
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

        <div>
          <label htmlFor="rp_confirm" className="block text-sm font-medium text-ink/70 mb-1">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              id="rp_confirm"
              name="confirm_password"
              type={showPassword ? 'text' : 'password'}
              required
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-cream-line bg-cream focus:outline-none focus:border-gold transition-colors"
              placeholder="Re-enter new password"
            />
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink/40" />
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
              <ShieldCheck className="w-4 h-4" />
              Update Password
            </>
          )}
        </button>
      </form>
    </div>
  )
}
