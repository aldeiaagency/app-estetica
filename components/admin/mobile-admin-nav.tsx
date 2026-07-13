'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, Menu, Sparkles, X } from 'lucide-react'
import { AdminNav } from '@/components/admin/admin-nav'

export function MobileAdminNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  useEffect(() => setOpen(false), [pathname])

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Abrir menu" aria-expanded={open} className="flex h-9 w-9 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-100">
        <Menu className="h-5 w-5" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} aria-label="Cerrar menu" />
          <aside className="relative flex h-full w-60 flex-col bg-zinc-900 text-white shadow-2xl">
            <div className="border-b border-zinc-800 px-6 py-5">
              <Link href="/" className="flex items-center gap-2"><Sparkles className="h-4 w-4" /><span className="font-bold">BellezaLocal</span></Link>
            </div>
            <AdminNav />
            <Link href="/auth/signout" className="m-3 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white"><LogOut className="h-4 w-4" />Cerrar sesion</Link>
            <button type="button" onClick={() => setOpen(false)} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-md hover:bg-zinc-800" aria-label="Cerrar menu"><X className="h-5 w-5" /></button>
          </aside>
        </div>
      )}
    </>
  )
}
