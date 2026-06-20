import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, CheckCircle2, Circle, Package, ShoppingBag, Sparkles, X } from 'lucide-react'
import { auth } from '@/lib/auth/config'
import { getBeautyProfile } from '@/app/actions/beauty-profile'
import { generateBeautyPlan } from '@/lib/beauty/recommendations'
import { getOrCreateMonthlyBeautyPlan, updatePlanItemStatusAction } from '@/app/actions/beauty-plan'
import { getRecommendedBeautyPacksForProfile } from '@/app/actions/beauty-packs'
import { getRecommendedProductsForProfile, type ProductRecommendation } from '@/app/actions/beauty-routine'
import { PublicHeader } from '@/components/ui/public-header'
import { PublicFooter } from '@/components/ui/public-footer'
import { BeautyPlanCard } from '@/components/beauty/beauty-plan-card'
import { BeautyPackCard } from '@/components/beauty/beauty-pack-card'
import { SaveToRoutineButton } from '@/components/beauty/save-to-routine-button'
import { formatPrice } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Mi Beauty Plan - Belleza Local',
  description: 'Tu plan de belleza mensual con recomendaciones claras, presupuesto orientativo y acciones para evitar compras innecesarias.',
  robots: { index: false },
}

export const dynamic = 'force-dynamic'

export default async function MiPlanPage() {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) redirect('/auth/signin?callbackUrl=/mi-plan')

  const profile = await getBeautyProfile(userId)

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#f1f4f8]">
        <PublicHeader />
        <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-[#d8dee9] bg-white p-8 text-center shadow-[0_24px_70px_rgba(12,19,36,0.08)]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-[#e5edff] text-[#2355c8]">
              <Sparkles className="h-6 w-6" />
            </div>
            <h1 className="mt-5 text-3xl font-black tracking-tight text-[#0c1324]">Todavía no tienes Beauty Plan</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#647089]">
              Completa tu Beauty Profile para que podamos recomendarte acciones, productos y centros segun tu perfil.
            </p>
            <Link href="/diagnostico" className="btn-primary mt-6 inline-flex">
              Crear mi Beauty Profile
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </main>
        <PublicFooter />
      </div>
    )
  }

  const generatedPlan = generateBeautyPlan(profile)
  const persistedPlan = await getOrCreateMonthlyBeautyPlan(userId)
  const recommendedPacks = await getRecommendedBeautyPacksForProfile(profile, 3)
  const recommendedProducts = await getRecommendedProductsForProfile(profile, 3)
  const firstName = session.user.name?.split(' ')[0] ?? 'Hola'
  const actionItems = persistedPlan?.items.filter(item => item.type !== 'AVOID' && item.type !== 'REMINDER') ?? generatedPlan.recommendations.map((item, index) => ({
    id: item.id,
    planId: 'generated',
    type: item.href.startsWith('/productos') ? 'PRODUCT' as const : 'SERVICE' as const,
    title: item.title,
    reason: item.reason,
    priority: index,
    serviceId: null,
    productId: null,
    packId: null,
    centerId: null,
    recommendedDate: null,
    estimatedPriceCents: null,
    status: 'PENDING' as const,
  }))
  const avoidItems = persistedPlan?.items.filter(item => item.type === 'AVOID') ?? generatedPlan.avoid.map((item, index) => ({
    id: item.id,
    planId: 'generated',
    type: 'AVOID' as const,
    title: item.title,
    reason: item.reason,
    priority: index,
    serviceId: null,
    productId: null,
    packId: null,
    centerId: null,
    recommendedDate: null,
    estimatedPriceCents: null,
    status: 'PENDING' as const,
  }))
  const reminderItems = persistedPlan?.items.filter(item => item.type === 'REMINDER') ?? generatedPlan.nextSteps.map((step, index) => ({
    id: `step-${index}`,
    planId: 'generated',
    type: 'REMINDER' as const,
    title: step,
    reason: null,
    priority: index,
    serviceId: null,
    productId: null,
    packId: null,
    centerId: null,
    recommendedDate: null,
    estimatedPriceCents: null,
    status: 'PENDING' as const,
  }))

  return (
    <div className="min-h-screen bg-[#f1f4f8]">
      <PublicHeader />

      <main>
        <section className="border-b border-[#d8dee9] bg-[#0c1324] text-white">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-white/64">{firstName}, este es tu plan</p>
                <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Tu Beauty Plan</h1>
              </div>
              <Link href="/diagnostico" className="inline-flex items-center gap-2 rounded-md border border-white/15 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10">
                Ajustar perfil
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <BeautyPlanCard plan={generatedPlan} />

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
            <div>
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2355c8]">Haz esto</p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-[#0c1324]">Recomendaciones principales</h2>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {actionItems.map(item => (
                  <article key={item.id} className="rounded-lg border border-[#d8dee9] bg-white p-5 shadow-[0_18px_45px_rgba(12,19,36,0.05)]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="rounded-full bg-[#e5edff] px-2.5 py-1 text-xs font-black text-[#2355c8]">
                          {item.type === 'PRODUCT' ? 'Producto' : item.type === 'PACK' ? 'Pack' : 'Servicio'}
                        </span>
                        <h3 className="mt-4 text-xl font-black tracking-tight text-[#0c1324]">{item.title}</h3>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                    {item.reason && <p className="mt-3 text-sm leading-6 text-[#46546b]">{item.reason}</p>}
                    {item.estimatedPriceCents && (
                      <div className="mt-4 rounded-md bg-[#f7f9fc] px-3 py-2 text-sm font-bold text-[#0c1324]">
                        Estimación máxima: {(item.estimatedPriceCents / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                      </div>
                    )}
                    <div className="mt-5 grid gap-2 sm:grid-cols-3">
                      {item.planId === 'generated' ? (
                        <Link href="/diagnostico" className="btn-outline w-full py-2 text-xs sm:col-span-3">
                          Guarda el perfil para marcar avances
                        </Link>
                      ) : (
                        <>
                          <form action={async () => {
                            'use server'
                            await updatePlanItemStatusAction(item.id, 'DONE')
                          }}>
                            <button type="submit" className="btn-primary w-full py-2 text-xs">
                              Hecho
                            </button>
                          </form>
                          <form action={async () => {
                            'use server'
                            await updatePlanItemStatusAction(item.id, 'SKIPPED')
                          }}>
                            <button type="submit" className="btn-outline w-full py-2 text-xs">
                              Omitir
                            </button>
                          </form>
                          <form action={async () => {
                            'use server'
                            await updatePlanItemStatusAction(item.id, 'DISMISSED')
                          }}>
                            <button type="submit" className="btn-outline w-full py-2 text-xs">
                              Descartar
                            </button>
                          </form>
                        </>
                      )}
                    </div>
                  </article>
                ))}
              </div>

              {recommendedPacks.length > 0 && (
                <div className="mt-8">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2355c8]">Packs que encajan</p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-[#0c1324]">Planes por objetivo</h2>
                  <div className="mt-4 grid gap-4">
                    {recommendedPacks.map(pack => (
                      <BeautyPackCard key={pack.id} pack={pack} compact />
                    ))}
                  </div>
                </div>
              )}

              {recommendedProducts.length > 0 && (
                <div className="mt-8">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#10786f]">Productos para tu rutina</p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-[#0c1324]">Recomendados por perfil</h2>
                  <div className="mt-4 grid gap-4">
                    {recommendedProducts.map(product => (
                      <RecommendedProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8b5b32]">Mejor evitar por ahora</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-[#0c1324]">Para no gastar mal</h2>
                <div className="mt-4 grid gap-3">
                  {avoidItems.map(item => (
                    <article key={item.id} className="rounded-lg border border-[#ead8c8] bg-[#fffaf5] p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#f4e2d4] text-[#8b5b32]">
                          <X className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="font-black text-[#0c1324]">{item.title}</h3>
                          {item.reason && <p className="mt-1 text-sm leading-6 text-[#6d5948]">{item.reason}</p>}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>

            <aside className="space-y-4">
              <section className="rounded-lg border border-[#d8dee9] bg-white p-5 shadow-[0_18px_45px_rgba(12,19,36,0.05)]">
                <p className="text-sm font-black text-[#0c1324]">Próximas acciones</p>
                <div className="mt-4 space-y-3">
                  {reminderItems.map(item => (
                    <div key={item.id} className="flex items-start gap-3 text-sm leading-6 text-[#46546b]">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#6f9277]" />
                      <span>{item.title}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-[#d8dee9] bg-white p-5 shadow-[0_18px_45px_rgba(12,19,36,0.05)]">
                <p className="text-sm font-black text-[#0c1324]">Beneficios</p>
                <p className="mt-2 text-sm leading-6 text-[#647089]">
                  Tu wallet ya recoge beneficios, bonos y próximas citas para que el plan tenga continuidad.
                </p>
                <Link href="/wallet" className="mt-4 inline-flex items-center gap-2 text-sm font-black text-[#2355c8]">
                  Abrir Beauty Wallet
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </section>
            </aside>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}

function RecommendedProductCard({ product }: { product: ProductRecommendation }) {
  return (
    <article className="rounded-lg border border-[#d8dee9] bg-white p-4 shadow-[0_18px_45px_rgba(12,19,36,0.05)]">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="h-28 w-full shrink-0 overflow-hidden rounded-md bg-[#e5edff] sm:w-28">
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-8 w-8 text-[#9db8ff]" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#e7f7f5] px-2.5 py-1 text-xs font-black text-[#10786f]">
              <ShoppingBag className="h-3 w-3" />
              Producto
            </span>
            {product.expectedDurationDays && (
              <span className="rounded-full bg-[#f1f4f8] px-2.5 py-1 text-xs font-bold text-[#647089]">
                {product.expectedDurationDays} dias aprox.
              </span>
            )}
          </div>
          <h3 className="mt-3 text-lg font-black tracking-tight text-[#0c1324]">{product.name}</h3>
          <p className="mt-1 text-sm font-semibold text-[#46546b]">
            {product.brand ? `${product.brand} · ` : ''}{formatPrice(product.priceCents)}
          </p>
          <p className="mt-2 text-sm leading-6 text-[#647089]">{product.reason}</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Link href={`/productos/${product.id}`} className="btn-primary justify-center py-2 text-xs">
              Ver producto
              <ArrowRight className="h-4 w-4" />
            </Link>
            <SaveToRoutineButton productId={product.id} compact />
          </div>
        </div>
      </div>
    </article>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    PENDING: { label: 'Pendiente', cls: 'bg-[#f1f4f8] text-[#647089]', icon: Circle },
    DONE: { label: 'Hecho', cls: 'bg-[#e7f7f5] text-[#10786f]', icon: CheckCircle2 },
    SKIPPED: { label: 'Omitido', cls: 'bg-amber-50 text-amber-700', icon: Circle },
    DISMISSED: { label: 'Descartado', cls: 'bg-[#fff2f0] text-red-700', icon: X },
  }[status] ?? { label: status, cls: 'bg-[#f1f4f8] text-[#647089]', icon: Circle }
  const Icon = config.icon

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ${config.cls}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  )
}
