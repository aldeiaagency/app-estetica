import { Metadata } from 'next'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { redirect } from 'next/navigation'
import { CheckCircle2, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Mi plan',
  robots: { index: false },
}

const PLAN_DETAILS = {
  BASIC: {
    name: 'Basic',
    price: '24 €/mes',
    color: 'bg-slate-100 text-slate-700',
    features: ['1 centro', '10 servicios', '3 profesionales', 'Reservas online', 'Agenda', 'Email de confirmación'],
  },
  PRO: {
    name: 'Pro',
    price: '49 €/mes',
    color: 'bg-blue-100 text-blue-700',
    features: ['1 centro', 'Servicios ilimitados', 'Profesionales ilimitados', 'Bonos y packs', 'Reseñas verificadas', 'Lista de espera', 'Todo lo de Basic'],
  },
  GROWTH: {
    name: 'Growth',
    price: '89 €/mes',
    color: 'bg-green-100 text-green-700',
    features: ['Hasta 3 centros', 'CRM de clientes', 'Featured listings', 'Analítica avanzada', 'Todo lo de Pro'],
  },
  PREMIUM: {
    name: 'Premium',
    price: '149 €/mes',
    color: 'bg-purple-100 text-purple-700',
    features: ['Centros ilimitados', 'White-label', 'API pública', 'Soporte prioritario', 'Onboarding asistido', 'Todo lo de Growth'],
  },
}

export default async function PlanPage() {
  const session = await auth()
  const orgId = session?.user?.organizationId
  if (!orgId) redirect('/auth/signin')

  const org = await prisma.organization.findFirst({
    where: { id: orgId },
    select: { name: true, plan: true, addOns: { where: { active: true }, select: { addOnType: true } } },
  })

  if (!org) redirect('/auth/signin')

  const currentPlan = PLAN_DETAILS[org.plan]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Mi plan</h1>
        <p className="mt-1 text-sm text-slate-500">Gestiona tu suscripción y add-ons.</p>
      </div>

      {/* Current plan */}
      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="mb-2 text-sm text-slate-500">Plan actual</p>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-sm font-bold ${currentPlan.color}`}>
                {currentPlan.name}
              </span>
              <span className="text-lg font-bold text-slate-900">{currentPlan.price}</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">{org.name}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {currentPlan.features.map(f => (
            <div key={f} className="flex items-center gap-2 text-sm text-slate-600">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Add-ons */}
      {org.addOns.length > 0 && (
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-bold text-slate-900">Add-ons activos</h2>
          <div className="flex flex-wrap gap-2">
            {org.addOns.map(a => (
              <span key={a.addOnType} className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                {a.addOnType.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Upgrade CTA */}
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
        <p className="mb-2 font-semibold text-slate-900">¿Necesitas más funcionalidades?</p>
        <p className="mb-4 text-sm text-slate-500">
          Para cambiar de plan o añadir add-ons contacta con nosotros.
        </p>
        <a
          href="mailto:hola@bellezalocal.es?subject=Cambio de plan"
          className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 transition-colors"
        >
          Contactar <ArrowRight className="h-4 w-4" />
        </a>
        <p className="mt-3 text-xs text-slate-400">
          La gestión de planes vía Stripe está en desarrollo (P1).
        </p>
      </div>
    </div>
  )
}
