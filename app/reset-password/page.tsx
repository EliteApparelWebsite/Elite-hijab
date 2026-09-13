import { Suspense } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ResetPasswordForm from './_components/ResetPasswordForm'

export const metadata = {
  title: 'Reset Password | Elite Hijab',
  description: 'Set a new password for your Elite Hijab account.',
}

export default function ResetPasswordPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream flex flex-col justify-center py-20 px-5">
        <div className="max-w-md w-full mx-auto bg-cream-deep p-8 rounded-3xl border border-gold/20 shadow-soft mt-16">
          <div className="text-center mb-8">
            <h1 className="font-heading text-3xl font-bold text-ink">Reset Password</h1>
            <p className="text-ink/70 mt-2 font-body">
              Choose a new password for your account.
            </p>
          </div>
          <Suspense fallback={null}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  )
}
