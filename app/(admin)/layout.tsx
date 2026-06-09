import Link from 'next/link'
import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { LogOut, Sparkles } from 'lucide-react'
import { AdminNav } from '@/components/admin/admin-nav'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
    redirect('/auth/signin')
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col bg-zinc-900 text-white md:flex">
        <div className="border-b border-zinc-800 px-6 py-5">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-600">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-white">BellezaLocal</span>
          </Link>
          <p className="mt-1 text-xs text-zinc-500">Panel de administración</p>
        </div>

        <AdminNav />

        <div className="border-t border-zinc-800 p-3">
          <Link
            href="/auth/signout"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-zinc-50 p-8">{children}</main>
    </div>
  )
}
