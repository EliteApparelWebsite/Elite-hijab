import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ForgotPasswordForm from './_components/ForgotPasswordForm'

export const metadata = {
  title: 'Forgot Password | Elite Hijab',
  description: 'Reset your Elite Hijab account password.',
}

export default function ForgotPasswordPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream flex flex-col justify-center py-20 px-5">
        <div className="max-w-md w-full mx-auto bg-cream-deep p-8 rounded-3xl border border-gold/20 shadow-soft mt-16">
          <div className="text-center mb-8">
            <h1 className="font-heading text-3xl font-bold text-ink">Forgot Password</h1>
            <p className="text-ink/70 mt-2 font-body">
              Enter your account email and we&apos;ll send you a reset link.
            </p>
          </div>
          <ForgotPasswordForm />
        </div>
      </main>
      <Footer />
    </>
  )
}
