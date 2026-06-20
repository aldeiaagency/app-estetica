import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, Bell, CheckCircle2, Clock3, Package, Repeat2, ShoppingBag } from 'lucide-react'
import { auth } from '@/lib/auth/config'
import { formatPrice } from '@/lib/utils'
import { PublicHeader } from '@/components/ui/public-header'
import { PublicFooter } from '@/components/ui/public-footer'
import {
  getReplenishmentForUser,
  markUsageFinishedAction,
  toggleReplenishmentAction,
  type ReplenishmentRecord,
} from '@/app/actions/beauty-routine'

export const metadata: Metadata = {
  title: 'Reposicion - Belleza Local',
  description: 'Recordatorios de reposicion y alternativas para productos de belleza.',
  robots: { index: false },
}

export const dynamic = 'force-dynamic'

function daysUntil(date: Date | null) {
  if (!date) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(date)
  end.setHours(0, 0, 0, 0)
  return Math.ceil((end.getTime() - today.getTime()) / 86_400_000)
}

function fmtDate(date: Date | null) {
  if (!date) return 'Sin fecha'
  return new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

function itemState(item: ReplenishmentRecord) {
  const days = daysUntil(item.expectedEndAt)
  if (item.status === 'PAUSED') return { label: 'Pausado', cls: 'bg-amber-50 text-amber-700', priority: 3 }
  if (days !== null && days <= 0) return { label: 'Reponer ahora', cls: 'bg-[#fff2f0] text-red-700', priority: 0 }
  if (days !== null && days <= 14) return { label: 'Pronto', cls: 'bg-[#fffaf5] text-[#8b5b32]', priority: 1 }
  return { label: 'Planificado', cls: 'bg-[#e7f7f5] text-[#10786f]', priority: 2 }
}

export default async function ReposicionPage() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) redirect('/auth/signin?callbackUrl=/reposicion')

  const { profile, items } = await getReplenishmentForUser(userId)
  const sortedItems = [...items].sort((a, b) => {
    const stateDiff = itemState(a).priority - itemState(b).priority
    if (stateDiff !== 0) return stateDiff
    const aDate = a.expectedEndAt ? new Date(a.expectedEndAt).getTime() : Number.MAX_SAFE_INTEGER
    const bDate = b.expectedEndAt ? new Date(b.expectedEndAt).getTime() : Number.MAX_SAFE_INTEGER
    return aDate - bDate
  })

  return (
    <div className="min-h-screen bg-[#f1f4f8]">
      <PublicHeader />

      <main>
        <section className="border-b border-[#d8dee9] bg-white">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2355c8]">Compra con tiempo</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-[#0c1324] sm:text-4xl">Reposicion</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#647089]">
                  Controla que productos se acaban, decide si activar aviso y mira alternativas cuando no convenga repetir.
                </p>
              </div>
              <Link href="/rutina" className="btn-outline justify-center">
                Ver rutina
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {!profile ? (
            <EmptyReposicion
              title="Primero necesitamos tu perfil"
              text="Tu Beauty Profile ayuda a sugerir productos, ritmos de uso y alternativas con mas criterio."
              cta={{ href: '/diagnostico', label: 'Crear perfil' }}
            />
          ) : sortedItems.length === 0 ? (
            <EmptyReposicion
              title="Todavia no hay productos en seguimiento"
              text="Guarda productos en tu rutina y activa el aviso de reposicion cuando quieras controlar su duracion."
              cta={{ href: '/productos', label: 'Explorar productos' }}
            />
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {sortedItems.map(item => (
                <ReplenishmentCard key={item.usageId} item={item} />
              ))}
            </div>
          )}
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}

function ReplenishmentCard({ item }: { item: ReplenishmentRecord }) {
  const state = itemState(item)
  const days = daysUntil(item.expectedEndAt)

  return (
    <article className="rounded-lg border border-[#d8dee9] bg-white p-4 shadow-sm">
      <div className="flex gap-4">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-md bg-[#e5edff]">
          {item.productImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.productImage} alt={item.productName} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-8 w-8 text-[#9db8ff]" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-black ${state.cls}`}>{state.label}</span>
            {item.replenishmentEnabled ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#e7f7f5] px-2.5 py-1 text-xs font-bold text-[#10786f]">
                <Bell className="h-3 w-3" />
                Aviso activo
              </span>
            ) : (
              <span className="rounded-full bg-[#f1f4f8] px-2.5 py-1 text-xs font-bold text-[#647089]">Sin aviso</span>
            )}
          </div>

          <h2 className="mt-3 text-lg font-black leading-tight text-[#0c1324]">{item.productName}</h2>
          {item.productBrand && <p className="text-xs font-semibold uppercase tracking-wider text-[#8b96aa]">{item.productBrand}</p>}

          <div className="mt-3 grid gap-2 text-sm text-[#46546b]">
            <p className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-[#8b96aa]" />
              {days === null
                ? 'Sin duracion estimada'
                : days <= 0
                  ? `Previsto para ${fmtDate(item.expectedEndAt)}`
                  : `Quedan aprox. ${days} dias`}
            </p>
            <p className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-[#8b96aa]" />
              {formatPrice(item.productPriceCents)} en {item.centerName}
            </p>
          </div>
        </div>
      </div>

      {item.alternativeProductId && item.alternativeProductName && (
        <div className="mt-4 rounded-md border border-[#cfe0ff] bg-[#f7f9fc] p-3">
          <p className="text-xs font-black uppercase tracking-wider text-[#2355c8]">Alternativa</p>
          <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-[#0c1324]">
              {item.alternativeProductName}
              {item.alternativeProductPriceCents !== null && (
                <span className="ml-2 text-[#647089]">{formatPrice(item.alternativeProductPriceCents)}</span>
              )}
            </p>
            <Link href={`/productos/${item.alternativeProductId}`} className="text-sm font-black text-[#2355c8]">
              Ver alternativa
            </Link>
          </div>
        </div>
      )}

      <div className="mt-4 grid gap-2 border-t border-[#e5eaf2] pt-4 sm:grid-cols-3">
        <Link href={`/productos/${item.productId}`} className="btn-primary justify-center py-2 text-xs">
          Ver producto
        </Link>
        <form action={async () => {
          'use server'
          await toggleReplenishmentAction(item.usageId, !item.replenishmentEnabled)
        }}>
          <button type="submit" className="btn-outline w-full justify-center py-2 text-xs">
            <Repeat2 className="h-4 w-4" />
            {item.replenishmentEnabled ? 'Pausar aviso' : 'Activar aviso'}
          </button>
        </form>
        <form action={async () => {
          'use server'
          await markUsageFinishedAction(item.usageId)
        }}>
          <button type="submit" className="btn-outline w-full justify-center py-2 text-xs">
            <CheckCircle2 className="h-4 w-4" />
            Terminado
          </button>
        </form>
      </div>
    </article>
  )
}

function EmptyReposicion({ title, text, cta }: { title: string; text: string; cta: { href: string; label: string } }) {
  return (
    <div className="rounded-lg border border-[#d8dee9] bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-[#e5edff] text-[#2355c8]">
        <Repeat2 className="h-6 w-6" />
      </div>
      <h2 className="mt-5 text-2xl font-black tracking-tight text-[#0c1324]">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#647089]">{text}</p>
      <Link href={cta.href} className="btn-primary mt-6 inline-flex">
        {cta.label}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}
