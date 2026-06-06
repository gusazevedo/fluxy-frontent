'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { LogoutDialog } from './LogoutDialog'

export function Navbar() {
  const { logout } = useAuth()
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
      <div className="mx-auto max-w-4xl flex items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold text-gray-900">
          Fluxy
        </Link>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          Log out
        </button>
      </div>
      <LogoutDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConfirm={logout}
      />
    </header>
  )
}
