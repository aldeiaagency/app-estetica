import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, BookmarkPlus, CheckCircle2, Clock3, Package, Pause, Play, Repeat2, Trash2 } from 'lucide-react'
import { auth } from '@/lib/auth/config'
import { formatPrice } from '@/lib/utils'
import { PublicHeader } from '@/components/ui/public-header'
import { PublicFooter } from '@/components/ui/public-footer'
import {
  getRoutineForUser,
  toggleReplenishmentAction,
  updateRoutineStepStatusAction,
  type BeautyRoutineMoment,
  type BeautyRoutineStepStatus,
  type BeautyRoutineStepType,
  type RoutineStepRecord,
} from '@/app/actions/beauty-routine'

export const metadata: Metadata = {
  title: 'Mi rutina - Belleza Local',
  description: 'Productos guardados, pasos de rutina y recordatorios de reposicion.',
  robots: { index: false },
}

export const dynamic = 'force-dynamic'

const STEP_LABELS: Record<BeautyRoutineStepType, string> = {
  CLEANSER: 'Limpieza',
  TONER: 'Tonico',
  SERUM: 'Serum',
  MOISTURIZER: 'Hidratacion',
  SPF: 'Proteccion solar',
  MASK: 'Mascarilla',
  HAIR_CARE: 'Cabello',
  NAIL_CARE: 'Unas',
  BODY_CARE: 'Cuerpo',
  MAKEUP: 'Maquillaje',
  WELLNESS: 'Bienestar',
  OTHER: 'Rutina',
}

const MOMENT_LABELS: Record<BeautyRoutineMoment, string> = {
  MORNING: 'Manana',
  EVENING: 'Noche',
  WEEKLY: 'Semanal',
  AS_NEEDED: 'Cuando lo necesites',
}

const STATUS_LABELS: Record<BeautyRoutineStepStatus, { label: string; cls: string }> = {
  ACTIVE: { label: 'Activo', cls: 'bg-[#e7f7f5] text-[#10786f]' },
  PAUSED: { label: 'Pausado', cls: 'bg-amber-50 text-amber-700' },
  FINISHED: { label: 'Terminado', cls: 'bg-[#e5eaf2] text-[#647089]' },
  REMOVED: { label: 'Quitado', cls: 'bg-[#fff2f0] text-red-700' },
}

function fmtDate(date: Date | null) {
  if (!date) return null
  return new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export default async function RutinaPage() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) redirect('/auth/signin?callbackUrl=/rutina')

  const { profile, steps } = await getRoutineForUser(userId)
  const activeSteps = steps.filter(step => step.status !== 'FINISHED')
  const finishedSteps = steps.filter(step => step.status === 'FINISHED')

  return (
    <div className="min-h-screen bg-[#f1f4f8]">
      <PublicHeader />

      <main>
        <section className="border-b border-[#d8dee9] bg-white">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2355c8]">Continuidad en casa</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-[#0c1324] sm:text-4xl">Mi rutina</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#647089]">
                  Guarda productos recomendados, pausa lo que no estes usando y activa reposicion solo cuando te interese.
                </p>
              </div>
              <Link href="/reposicion" className="btn-outline justify-center">
                Ver reposicion
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {!profile ? (
            <EmptyRoutine
              title="Crea tu Beauty Profile para preparar una rutina"
              text="Con tu Beauty Profile podremos recomendar productos con sentido, no una lista generica."
              cta={{ href: '/diagnostico', label: 'Crear perfil' }}
            />
          ) : steps.length === 0 ? (
            <EmptyRoutine
              title="Todavia no has guardado productos"
              text="Cuando encuentres un producto que encaje, guardalo y aparecera aqui con instrucciones y reposicion."
              cta={{ href: '/productos', label: 'Explorar productos' }}
            />
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <div className="space-y-4">
                {activeSteps.map(step => (
                  <RoutineStepCard key={step.id} step={step} />
                ))}

                {finishedSteps.length > 0 && (
                  <section className="pt-4">
                    <h2 className="text-sm font-black uppercase tracking-[0.18em] text-[#647089]">Terminados</h2>
                    <div className="mt-3 space-y-3">
                      {finishedSteps.map(step => (
                        <RoutineStepCard key={step.id} step={step} compact />
                      ))}
                    </div>
                  </section>
                )}
              </div>

              <aside className="space-y-4">
                <section className="rounded-lg border border-[#d8dee9] bg-white p-5 shadow-sm">
                  <p className="text-sm font-black text-[#0c1324]">Resumen</p>
                  <div className="mt-4 grid gap-3 text-sm">
                    <Metric label="Productos activos" value={activeSteps.length} />
                    <Metric label="Con reposicion" value={steps.filter(step => step.replenishmentEnabled).length} />
                    <Metric label="Pausados" value={steps.filter(step => step.status === 'PAUSED').length} />
                  </div>
                </section>

                <section className="rounded-lg border border-[#d8dee9] bg-white p-5 shadow-sm">
                  <p className="text-sm font-black text-[#0c1324]">Siguiente paso</p>
                  <p className="mt-2 text-sm leading-6 text-[#647089]">
                    Revisa productos que pueden acabarse pronto y decide si reponer, pausar o buscar alternativa.
                  </p>
                  <Link href="/reposicion" className="mt-4 inline-flex items-center gap-2 text-sm font-black text-[#2355c8]">
                    Abrir reposicion
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </section>
              </aside>
            </div>
          )}
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}

function RoutineStepCard({ step, compact = false }: { step: RoutineStepRecord; compact?: boolean }) {
  const status = STATUS_LABELS[step.status] ?? STATUS_LABELS.ACTIVE
  const expectedEnd = fmtDate(step.expectedEndAt)

  return (
    <article className="rounded-lg border border-[#d8dee9] bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className={compact ? 'h-20 w-20 shrink-0 overflow-hidden rounded-md bg-[#e5edff]' : 'h-24 w-24 shrink-0 overflow-hidden rounded-md bg-[#e5edff]'}>
          {step.productImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={step.productImage} alt={step.productName ?? step.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-8 w-8 text-[#9db8ff]" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#e5edff] px-2.5 py-1 text-xs font-black text-[#2355c8]">
              {STEP_LABELS[step.stepType] ?? 'Rutina'}
            </span>
            <span className="rounded-full bg-[#f1f4f8] px-2.5 py-1 text-xs font-bold text-[#647089]">
              {MOMENT_LABELS[step.moment] ?? 'Rutina'}
            </span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${status.cls}`}>{status.label}</span>
          </div>

          <h2 className="mt-3 text-lg font-black text-[#0c1324]">{step.productName ?? step.title}</h2>
          {step.productBrand && <p className="text-xs font-semibold uppercase tracking-wider text-[#8b96aa]">{step.productBrand}</p>}
          {step.instructions && !compact && <p className="mt-3 text-sm leading-6 text-[#46546b]">{step.instructions}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-[#647089]">
            {step.productPriceCents !== null && <span>{formatPrice(step.productPriceCents)}</span>}
            {expectedEnd && (
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3.5 w-3.5" />
                Previsto: {expectedEnd}
              </span>
            )}
            {step.replenishmentEnabled && (
              <span className="inline-flex items-center gap-1 text-[#10786f]">
                <Repeat2 className="h-3.5 w-3.5" />
                Reposicion activa
              </span>
            )}
          </div>
        </div>
      </div>

      {!compact && (
        <div className="mt-4 grid gap-2 border-t border-[#e5eaf2] pt-4 sm:grid-cols-4">
          {step.status === 'PAUSED' ? (
            <form action={async () => {
              'use server'
              await updateRoutineStepStatusAction(step.id, 'ACTIVE')
            }}>
              <button type="submit" className="btn-outline w-full justify-center py-2 text-xs">
                <Play className="h-4 w-4" />
                Reanudar
              </button>
            </form>
          ) : (
            <form action={async () => {
              'use server'
              await updateRoutineStepStatusAction(step.id, 'PAUSED')
            }}>
              <button type="submit" className="btn-outline w-full justify-center py-2 text-xs">
                <Pause className="h-4 w-4" />
                Pausar
              </button>
            </form>
          )}

          <form action={async () => {
            'use server'
            await updateRoutineStepStatusAction(step.id, 'FINISHED')
          }}>
            <button type="submit" className="btn-outline w-full justify-center py-2 text-xs">
              <CheckCircle2 className="h-4 w-4" />
              Terminado
            </button>
          </form>

          {step.usageId ? (
            <form action={async () => {
              'use server'
              await toggleReplenishmentAction(step.usageId!, !Boolean(step.replenishmentEnabled))
            }}>
              <button type="submit" className="btn-outline w-full justify-center py-2 text-xs">
                <Repeat2 className="h-4 w-4" />
                {step.replenishmentEnabled ? 'Quitar aviso' : 'Avisarme'}
              </button>
            </form>
          ) : (
            <span />
          )}

          <form action={async () => {
            'use server'
            await updateRoutineStepStatusAction(step.id, 'REMOVED')
          }}>
            <button type="submit" className="btn-outline w-full justify-center py-2 text-xs text-red-700 hover:bg-red-50">
              <Trash2 className="h-4 w-4" />
              Quitar
            </button>
          </form>
        </div>
      )}
    </article>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-[#f7f9fc] px-3 py-2">
      <span className="text-[#647089]">{label}</span>
      <span className="font-black text-[#0c1324]">{value}</span>
    </div>
  )
}

function EmptyRoutine({ title, text, cta }: { title: string; text: string; cta: { href: string; label: string } }) {
  return (
    <div className="rounded-lg border border-[#d8dee9] bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-[#e5edff] text-[#2355c8]">
        <BookmarkPlus className="h-6 w-6" />
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
