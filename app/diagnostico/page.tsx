import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, LockKeyhole, Sparkles } from 'lucide-react'
import { auth } from '@/lib/auth/config'
import { getBeautyProfile } from '@/app/actions/beauty-profile'
import { PublicHeader } from '@/components/ui/public-header'
import { PublicFooter } from '@/components/ui/public-footer'
import { BeautyProfileForm } from '@/components/beauty/beauty-profile-form'
import type { BeautyProfileFormInitialValues } from '@/components/beauty/beauty-profile-form'

export const metadata: Metadata = {
  title: 'Diagnóstico de belleza - Belleza Local',
  description: 'Crea tu Beauty Profile y recibe un plan de belleza inicial segun tus objetivos, presupuesto y estilo.',
  robots: { index: false },
}

export const dynamic = 'force-dynamic'

function budgetToOption(cents?: number | null): BeautyProfileFormInitialValues['monthlyBudget'] {
  if (!cents) return 'BETWEEN_40_80'
  if (cents <= 4000) return 'UNDER_40'
  if (cents <= 8000) return 'BETWEEN_40_80'
  if (cents <= 15000) return 'BETWEEN_80_150'
  return 'OVER_150'
}

export default async function DiagnosticoPage() {
  const session = await auth()
  const userId = session?.user?.id

  const profile = userId ? await getBeautyProfile(userId) : null

  const initialValues: BeautyProfileFormInitialValues | undefined = profile
    ? {
        goals: profile.goals.map(goal => goal.area),
        mainConcern: profile.mainConcern,
        secondaryConcern: profile.secondaryConcern,
        skinType: profile.skinType,
        hairType: profile.hairType,
        beautyStyle: profile.beautyStyle,
        monthlyBudget: budgetToOption(profile.monthlyBudgetCents),
        maintenanceLevel: profile.maintenanceLevel,
        priceSensitivity: profile.priceSensitivity,
        buyingMotivation: profile.buyingMotivation,
        fear: profile.fear,
      }
    : undefined

  return (
    <div className="min-h-screen bg-[#f1f4f8]">
      <PublicHeader />

      <main>
        <section className="border-b border-[#d8dee9] bg-[#0c1324] text-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8 lg:py-16">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80">
                <Sparkles className="h-3.5 w-3.5 text-[#9db8ff]" />
                Beauty concierge personal
              </span>
              <h1 className="mt-5 max-w-2xl text-4xl font-black tracking-tight sm:text-6xl">
                Cuéntanos qué quieres mejorar.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/72">
                Creamos tu Beauty Profile para recomendarte qué hacerte, qué comprar y qué evitar segun tu objetivo, presupuesto y estilo.
              </p>
              <div className="mt-7 grid gap-3 text-sm text-white/70 sm:grid-cols-3">
                <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
                  <p className="font-black text-white">Sin comprar a ciegas</p>
                  <p className="mt-1 leading-5">Cada recomendación explica el motivo.</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
                  <p className="font-black text-white">Precio visible</p>
                  <p className="mt-1 leading-5">Trabajamos con rangos y acciones claras.</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
                  <p className="font-black text-white">Belleza no médica</p>
                  <p className="mt-1 leading-5">Cuidado realista, sin promesas imposibles.</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.06] p-5">
              <p className="text-sm font-black text-white">Resultado esperado</p>
              <div className="mt-4 space-y-3 text-sm text-white/72">
                <p className="rounded-md bg-white/10 p-3">Prioridad del mes segun tu perfil.</p>
                <p className="rounded-md bg-white/10 p-3">2 recomendaciones accionables con motivo.</p>
                <p className="rounded-md bg-white/10 p-3">Qué conviene evitar para no gastar mal.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          {userId ? (
            <BeautyProfileForm initialValues={initialValues} />
          ) : (
            <div className="rounded-lg border border-[#d8dee9] bg-white p-8 text-center shadow-[0_24px_70px_rgba(12,19,36,0.08)]">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-[#e5edff] text-[#2355c8]">
                <LockKeyhole className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-2xl font-black tracking-tight text-[#0c1324]">Inicia sesión para guardar tu Beauty Profile</h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#647089]">
                Así podremos mantener tu plan, recordar tus preferencias y actualizar recomendaciones cuando cambie tu objetivo.
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/auth/signin?callbackUrl=/diagnostico" className="btn-primary">
                  Iniciar sesión
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/auth/signup" className="btn-outline">
                  Crear cuenta
                </Link>
              </div>
            </div>
          )}
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
