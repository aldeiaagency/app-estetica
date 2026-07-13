import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { SidebarNav } from '@/components/dashboard/sidebar-nav'
import { MobileSidebar } from '@/components/dashboard/mobile-sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user || !['BUSINESS', 'BUSINESS_ADMIN'].includes(session.user.role)) {
    redirect('/auth/signin?callbackUrl=/dashboard')
  }

  const center = session.user.organizationId
    ? await prisma.center.findFirst({
        where: { organizationId: session.user.organizationId },
        select: { name: true },
      })
    : null

  return (
    <div className="flex min-h-screen bg-[#f1f4f8]">
      <div className="hidden md:flex">
        <SidebarNav
          userName={session.user.name}
          userEmail={session.user.email}
          centerName={center?.name}
        />
      </div>

      <div className="fixed top-0 z-40 flex w-full items-center justify-between border-b border-[#d8dee9] bg-[#f1f4f8]/95 px-4 py-3 shadow-sm backdrop-blur md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#2f6df6] shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-black tracking-tight text-[#0c1324]">Belleza Local</span>
        </Link>
        <MobileSidebar userName={session.user.name} userEmail={session.user.email} centerName={center?.name} />
      </div>

      <main className="flex-1 overflow-auto pt-14 md:pt-0">
        <div className="min-h-full p-5 md:p-8">{children}</div>
      </main>
    </div>
  )
}
