import Link from 'next/link'
// import { auth } from '@/lib/auth/config'
// import { redirect } from 'next/navigation'

const ADMIN_NAV = [
  { href: '/admin', label: 'Overview', icon: '📊' },
  { href: '/admin/centros', label: 'Centros', icon: '🏪' },
  { href: '/admin/organizaciones', label: 'Organizaciones', icon: '🏢' },
  { href: '/admin/planes', label: 'Planes', icon: '💳' },
  { href: '/admin/categorias', label: 'Categorías', icon: '🗂️' },
  { href: '/admin/seo', label: 'SEO / Indexación', icon: '🔍' },
  { href: '/admin/metricas', label: 'Métricas', icon: '📈' },
  { href: '/admin/audit', label: 'Auditoría', icon: '🔒' },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // TODO: uncomment when Auth.js is configured
  // const session = await auth()
  // if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
  //   redirect('/auth/signin')
  // }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-[240px] flex-col bg-[#0f0c0d] text-white md:flex">
        <div className="border-b border-[#2a2427] p-6">
          <Link href="/admin" className="text-lg font-black">
            Admin<span className="text-[#9d5c63]">Panel</span>
          </Link>
          <p className="mt-1 text-xs text-[#756b6b]">Belleza Local · Plataforma</p>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {ADMIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-[#9d9090] hover:bg-[#2a2427] hover:text-white"
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-auto bg-[#fffaf7] p-8">{children}</main>
    </div>
  )
}
