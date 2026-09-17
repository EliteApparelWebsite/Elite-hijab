import { createClient } from '@/lib/supabase/server'
import { LogOut, User } from 'lucide-react'
import { logout } from '@/actions/auth'
import { cookies } from 'next/headers'
import MobileMenuButton from './MobileMenuButton'

export default async function AdminHeader() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const cookieStore = await cookies()
  const mockSessionCookie = cookieStore.get('hijabistaa-user-session')?.value
  let mockUser = null

  if (mockSessionCookie) {
    try {
      mockUser = JSON.parse(mockSessionCookie)
    } catch (e) {}
  }

  const userEmail = user?.email || mockUser?.email || 'Admin'

  return (
    <header className="h-16 bg-white border-b border-stone-200 flex items-center justify-between px-3 sm:px-6 gap-2 shrink-0">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <MobileMenuButton />
        <h2 className="text-base sm:text-lg font-semibold text-stone-900 truncate">
          Admin Dashboard
        </h2>
        <a
          href="/"
          target='_blank'
          className="text-xs font-semibold text-[#9C5247] hover:text-white border border-[#9C5247] hover:bg-[#9C5247] px-2.5 sm:px-3.5 py-1 rounded-full transition-colors flex items-center gap-1 shadow-sm duration-200 shrink-0"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          <span className="hidden sm:inline">View Site</span>
        </a>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Admin info */}
        <div className="hidden md:flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
            <User className="w-4 h-4 text-stone-500" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-stone-700 leading-tight">
              {userEmail}
            </p>
            <p className="text-xs text-stone-400">Administrator</p>
          </div>
        </div>

        {/* Logout */}
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-sm bg-emerald text-white font-body transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </form>
      </div>
    </header>
  )
}
