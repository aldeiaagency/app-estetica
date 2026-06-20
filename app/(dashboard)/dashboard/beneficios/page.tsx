import { Gift, Sparkles } from 'lucide-react'
import { auth } from '@/lib/auth/config'
import {
  createBeautyBenefitAction,
  getBenefitsForOrganization,
  toggleBeautyBenefitActiveAction,
  type BenefitInput,
} from '@/app/actions/benefits'

const BENEFIT_TYPES = [
  ['DISCOUNT', 'Descuento'],
  ['PRIORITY_BOOKING', 'Reserva prioritaria'],
  ['FREE_DIAGNOSIS', 'Diagnóstico incluido'],
  ['GIFT', 'Regalo'],
  ['MEMBER_ONLY_PACK', 'Pack privado'],
  ['FREE_REVIEW', 'Revisión incluida'],
  ['CASHBACK', 'Cashback'],
  ['POINTS', 'Puntos'],
] as const

export default async function DashboardBeneficiosPage() {
  const session = await auth()
  const orgId = session?.user?.organizationId
  const benefits = orgId ? await getBenefitsForOrganization(orgId) : []

  async function createBenefit(formData: FormData) {
    'use server'
    const input: BenefitInput = {
      title: String(formData.get('title') ?? ''),
      description: String(formData.get('description') ?? ''),
      benefitType: String(formData.get('benefitType') ?? 'DISCOUNT') as BenefitInput['benefitType'],
      value: String(formData.get('value') ?? ''),
      membersOnly: formData.get('membersOnly') === 'on',
    }
    await createBeautyBenefitAction(input)
  }

  return (
    <div className="space-y-8">
      <div className="page-header">
        <div>
          <p className="section-eyebrow">Fidelización</p>
          <h1 className="page-title">Beneficios para usuarias</h1>
          <p className="page-subtitle">
            Crea ventajas visibles en tu ficha y en la wallet de las clientas.
          </p>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <form action={createBenefit} className="card space-y-4 p-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#e5edff] text-[#2355c8]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-black text-[#0c1324]">Nuevo beneficio</h2>
              <p className="text-xs text-[#647089]">Visible para miembros y perfiles activos.</p>
            </div>
          </div>

          <label className="block">
            <span className="label">Título</span>
            <input name="title" className="input-base" placeholder="Ej: Diagnóstico incluido" required />
          </label>

          <label className="block">
            <span className="label">Descripción</span>
            <textarea
              name="description"
              className="input-base min-h-24"
              placeholder="Explica por qué este beneficio aporta valor sin sonar a descuento agresivo."
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="label">Tipo</span>
              <select name="benefitType" className="input-base">
                {BENEFIT_TYPES.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="label">Valor</span>
              <input name="value" className="input-base" placeholder="10%, incluido, regalo..." />
            </label>
          </div>

          <label className="flex items-start gap-3 rounded-md border border-[#d8dee9] bg-[#f7f9fc] p-3">
            <input name="membersOnly" type="checkbox" defaultChecked className="mt-1 h-4 w-4" />
            <span className="text-sm leading-6 text-[#46546b]">
              Solo para usuarias con Beauty Profile o wallet activa.
            </span>
          </label>

          <button type="submit" className="btn-primary w-full">
            Crear beneficio
          </button>
        </form>

        <section className="card overflow-hidden">
          <div className="border-b border-[#e5eaf2] px-6 py-4">
            <h2 className="font-black text-[#0c1324]">Beneficios publicados</h2>
            <p className="mt-1 text-sm text-[#647089]">
              Puedes pausar beneficios sin borrarlos.
            </p>
          </div>

          {benefits.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Gift className="mx-auto h-10 w-10 text-[#8b96aa]" />
              <p className="mt-3 font-bold text-[#0c1324]">Aún no has creado beneficios</p>
              <p className="mt-1 text-sm text-[#647089]">
                Empieza con asesoria incluida, revision o pequeno regalo.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#e5eaf2]">
              {benefits.map(benefit => (
                <article key={benefit.id} className="grid gap-4 px-6 py-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-black text-[#0c1324]">{benefit.title}</p>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-black ${benefit.active ? 'bg-[#e7f7f5] text-[#10786f]' : 'bg-[#f1f4f8] text-[#647089]'}`}>
                        {benefit.active ? 'Activo' : 'Pausado'}
                      </span>
                      {benefit.value && (
                        <span className="rounded-full bg-[#e5edff] px-2.5 py-1 text-xs font-black text-[#2355c8]">
                          {benefit.value}
                        </span>
                      )}
                    </div>
                    {benefit.description && <p className="mt-1 text-sm leading-6 text-[#647089]">{benefit.description}</p>}
                  </div>
                  <form action={async () => {
                    'use server'
                    await toggleBeautyBenefitActiveAction(benefit.id)
                  }}>
                    <button type="submit" className={benefit.active ? 'btn-outline' : 'btn-primary'}>
                      {benefit.active ? 'Pausar' : 'Activar'}
                    </button>
                  </form>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </div>
  )
}
