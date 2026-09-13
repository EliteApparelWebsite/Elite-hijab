'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Mail, ArrowRight, Check, Loader2 } from 'lucide-react'
import { requestPasswordReset, type AuthResult } from '@/actions/auth'

export default function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<AuthResult, FormData>(requestPasswordReset, {})

  return (
    <div className="space-y-6 animate-fade-in">
      {state?.success ? (
        <div className="p-4 bg-green-50 text-green-700 rounded-xl text-sm border border-green-100 flex items-start gap-2">
          <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>{state.message}</p>
        </div>
      ) : (
        <form action={formAction} className="space-y-4">
          {state?.error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-start gap-2">
              <span className="font-semibold mt-0.5">Oops!</span>
              <p>{state.error}</p>
            </div>
          )}

          <div>
            <label htmlFor="fp_email" className="block text-sm font-medium text-ink/70 mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                id="fp_email"
                name="email"
                type="email"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-cream-line bg-cream focus:outline-none focus:border-gold transition-colors"
                placeholder="you@example.com"
              />
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink/40" />
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
                Send Reset Link
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      <div className="pt-4 border-t border-cream-line text-center">
        <Link href="/login" className="text-sm font-semibold text-ink hover:text-gold transition-colors underline underline-offset-4">
          Back to Login
        </Link>
      </div>
    </div>
  )
}
