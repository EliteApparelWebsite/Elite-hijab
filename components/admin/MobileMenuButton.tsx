'use client'

import { Menu } from 'lucide-react'
import { useMobileSidebar } from './MobileSidebarContext'

export default function MobileMenuButton() {
  const { toggle } = useMobileSidebar()

  return (
    <button
      onClick={toggle}
      aria-label="Open menu"
      className="p-2 -ml-2 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors lg:hidden shrink-0"
    >
      <Menu className="w-5 h-5" />
    </button>
  )
}
