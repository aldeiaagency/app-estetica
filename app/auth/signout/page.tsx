'use client'

import { useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { Loader2 } from 'lucide-react'

export default function SignOutPage() {
  useEffect(() => {
    signOut({ callbackUrl: '/' })
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex items-center gap-3 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Cerrando sesión...</span>
      </div>
    </div>
  )
}
