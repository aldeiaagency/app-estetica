'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FormEvent, useMemo, useState, useTransition } from 'react'
import { ArrowRight, Check, Sparkles } from 'lucide-react'
import { submitDiagnosisAction } from '@/app/actions/beauty-profile'
import type { DiagnosisInput } from '@/app/actions/beauty-profile'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type Option = {
  value: string
  label: string
  description?: string
}

export type BeautyProfileFormInitialValues = {
  goals: string[]
  mainConcern?: string | null
  secondaryConcern?: string | null
  skinType?: string | null
  hairType?: string | null
  beautyStyle?: string | null
  monthlyBudget?: DiagnosisInput['monthlyBudget']
  maintenanceLevel?: string | null
  priceSensitivity?: string | null
  buyingMotivation?: string | null
  fear?: string | null
}

const AREA_OPTIONS: Option[] = [
  { value: 'SKIN', label: 'Piel', description: 'Luminosidad, textura, rutina sencilla' },
  { value: 'HAIR', label: 'Cabello', description: 'Brillo, color, cuidado post-servicio' },
  { value: 'NAILS', label: 'Uñas', description: 'Mantenimiento, evento o acabado natural' },
  { value: 'BROWS_LASHES', label: 'Mirada', description: 'Cejas, pestañas y expresión natural' },
  { value: 'BODY', label: 'Cuerpo', description: 'Cuidado corporal y bienestar' },
  { value: 'WELLNESS', label: 'Bienestar', description: 'Rituales, masaje y desconexion' },
]

const BUDGET_OPTIONS: Option[] = [
  { value: 'UNDER_40', label: 'Menos de 40 €', description: 'Quiero empezar con algo contenido' },
  { value: 'BETWEEN_40_80', label: '40-80 €', description: 'Busco equilibrio entre precio y resultado' },
  { value: 'BETWEEN_80_150', label: '80-150 €', description: 'Puedo invertir si tiene sentido' },
  { value: 'OVER_150', label: 'Más de 150 €', description: 'Prefiero un plan completo o premium' },
]

const MAINTENANCE_OPTIONS: Option[] = [
  { value: 'LOW', label: 'Bajo', description: 'Pocas acciones y fácil de mantener' },
  { value: 'MEDIUM', label: 'Medio', description: 'Puedo seguir una rutina simple' },
  { value: 'HIGH', label: 'Alto', description: 'Acepto más pasos y visitas frecuentes' },
]

const STYLE_OPTIONS: Option[] = [
  { value: 'NATURAL', label: 'Natural' },
  { value: 'ELEGANT', label: 'Elegante' },
  { value: 'MINIMAL', label: 'Minimalista' },
  { value: 'PRACTICAL', label: 'Práctico' },
  { value: 'PREMIUM', label: 'Premium' },
  { value: 'BOLD', label: 'Atrevido' },
]

const PRICE_OPTIONS: Option[] = [
  { value: 'HIGH', label: 'Económico', description: 'Priorizar alternativas ajustadas' },
  { value: 'MEDIUM', label: 'Equilibrado', description: 'Precio y calidad en balance' },
  { value: 'LOW', label: 'Premium si merece', description: 'Pagar más si aporta valor real' },
]

const MOTIVATION_OPTIONS: Option[] = [
  { value: 'ROUTINE', label: 'Crear rutina' },
  { value: 'EVENT', label: 'Evento próximo' },
  { value: 'PROBLEM_SOLVING', label: 'Resolver algo concreto' },
  { value: 'SELF_CARE', label: 'Cuidarme más' },
  { value: 'RECOMMENDATION', label: 'Dejarme asesorar' },
]

const FEAR_OPTIONS: Option[] = [
  { value: 'WASTING_MONEY', label: 'Gastar de más' },
  { value: 'NOT_KNOWING_WHAT_TO_CHOOSE', label: 'Elegir mal' },
  { value: 'LOOKING_ARTIFICIAL', label: 'Verme artificial' },
  { value: 'TOO_MUCH_MAINTENANCE', label: 'Demasiado mantenimiento' },
  { value: 'IRRITATION_OR_REACTION', label: 'Que mi piel reaccione' },
]

const SKIN_OPTIONS: Option[] = [
  { value: 'UNKNOWN', label: 'No lo sé' },
  { value: 'DRY', label: 'Seca' },
  { value: 'OILY', label: 'Grasa' },
  { value: 'COMBINATION', label: 'Mixta' },
  { value: 'SENSITIVE', label: 'Sensible' },
  { value: 'NORMAL', label: 'Normal' },
]

const HAIR_OPTIONS: Option[] = [
  { value: 'UNKNOWN', label: 'No lo sé' },
  { value: 'STRAIGHT', label: 'Liso' },
  { value: 'WAVY', label: 'Ondulado' },
  { value: 'CURLY', label: 'Rizado' },
  { value: 'FINE', label: 'Fino' },
  { value: 'THICK', label: 'Grueso' },
  { value: 'COLORED', label: 'Coloreado' },
  { value: 'DAMAGED', label: 'Castigado' },
]

export function BeautyProfileForm({ initialValues }: { initialValues?: BeautyProfileFormInitialValues }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [goals, setGoals] = useState<string[]>(initialValues?.goals?.slice(0, 3) ?? ['SKIN'])
  const [mainConcern, setMainConcern] = useState(initialValues?.mainConcern ?? '')
  const [secondaryConcern, setSecondaryConcern] = useState(initialValues?.secondaryConcern ?? '')
  const [skinType, setSkinType] = useState(initialValues?.skinType ?? 'UNKNOWN')
  const [hairType, setHairType] = useState(initialValues?.hairType ?? 'UNKNOWN')
  const [beautyStyle, setBeautyStyle] = useState(initialValues?.beautyStyle ?? 'NATURAL')
  const [monthlyBudget, setMonthlyBudget] = useState<DiagnosisInput['monthlyBudget']>(initialValues?.monthlyBudget ?? 'BETWEEN_40_80')
  const [maintenanceLevel, setMaintenanceLevel] = useState(initialValues?.maintenanceLevel ?? 'LOW')
  const [priceSensitivity, setPriceSensitivity] = useState(initialValues?.priceSensitivity ?? 'MEDIUM')
  const [buyingMotivation, setBuyingMotivation] = useState(initialValues?.buyingMotivation ?? 'RECOMMENDATION')
  const [fear, setFear] = useState(initialValues?.fear ?? 'NOT_KNOWING_WHAT_TO_CHOOSE')
  const [consentPersonalization, setConsentPersonalization] = useState(false)

  const progress = useMemo(() => {
    let score = 0
    if (goals.length > 0) score += 25
    if (mainConcern.trim().length >= 3) score += 25
    if (monthlyBudget && maintenanceLevel) score += 25
    if (beautyStyle && priceSensitivity && buyingMotivation) score += 25
    return score
  }, [beautyStyle, buyingMotivation, goals.length, mainConcern, maintenanceLevel, monthlyBudget, priceSensitivity])

  const toggleGoal = (goal: string) => {
    setGoals(current => {
      if (current.includes(goal)) return current.filter(item => item !== goal)
      if (current.length >= 3) return current
      return [...current, goal]
    })
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const input: DiagnosisInput = {
      goals: goals as DiagnosisInput['goals'],
      mainConcern,
      secondaryConcern: secondaryConcern.trim() || undefined,
      skinType: skinType as DiagnosisInput['skinType'],
      hairType: hairType as DiagnosisInput['hairType'],
      beautyStyle: beautyStyle as DiagnosisInput['beautyStyle'],
      monthlyBudget,
      maintenanceLevel: maintenanceLevel as DiagnosisInput['maintenanceLevel'],
      priceSensitivity: priceSensitivity as DiagnosisInput['priceSensitivity'],
      buyingMotivation: buyingMotivation as DiagnosisInput['buyingMotivation'],
      fear: fear as DiagnosisInput['fear'],
      consentPersonalization,
    }

    startTransition(async () => {
      const result = await submitDiagnosisAction(input)
      if (!result.success) {
        setError(result.error)
        return
      }
      router.push('/mi-plan')
    })
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-[#d8dee9] bg-white p-5 shadow-[0_24px_70px_rgba(12,19,36,0.08)] sm:p-7">
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#2355c8]">Beauty Profile</span>
          <span className="text-xs font-bold text-[#647089]">{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#e5eaf2]">
          <div className="h-full rounded-full bg-[#2f6df6] transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <fieldset>
        <legend className="text-lg font-black text-[#0c1324]">¿Qué quieres mejorar ahora?</legend>
        <p className="mt-1 text-sm text-[#647089]">Elige hasta 3 prioridades. Puedes cambiarlas después.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {AREA_OPTIONS.map(option => (
            <ChoiceButton
              key={option.value}
              option={option}
              selected={goals.includes(option.value)}
              onClick={() => toggleGoal(option.value)}
            />
          ))}
        </div>
      </fieldset>

      <div className="mt-7 grid gap-5">
        <Textarea
          label="Cuéntanos tu objetivo principal"
          value={mainConcern}
          onChange={event => setMainConcern(event.target.value)}
          placeholder="Ej: quiero verme la piel más luminosa sin complicarme con muchos productos"
          maxLength={180}
          required
          hint="No necesitamos datos médicos. Solo qué te gustaría mejorar a nivel de belleza y cuidado."
        />
        <Input
          label="Algo secundario que te gustaría tener en cuenta"
          value={secondaryConcern}
          onChange={event => setSecondaryConcern(event.target.value)}
          placeholder="Ej: tengo un evento, quiero ahorrar, prefiero algo natural"
          maxLength={180}
        />
      </div>

      <div className="mt-7 grid gap-7 lg:grid-cols-2">
        <ChoiceGroup title="Presupuesto mensual orientativo" options={BUDGET_OPTIONS} value={monthlyBudget} onChange={value => setMonthlyBudget(value as DiagnosisInput['monthlyBudget'])} />
        <ChoiceGroup title="Nivel de mantenimiento" options={MAINTENANCE_OPTIONS} value={maintenanceLevel} onChange={setMaintenanceLevel} />
        <ChoiceGroup title="Estilo que prefieres" options={STYLE_OPTIONS} value={beautyStyle} onChange={setBeautyStyle} compact />
        <ChoiceGroup title="Cómo quieres comprar" options={PRICE_OPTIONS} value={priceSensitivity} onChange={setPriceSensitivity} />
        <ChoiceGroup title="Qué te mueve ahora" options={MOTIVATION_OPTIONS} value={buyingMotivation} onChange={setBuyingMotivation} compact />
        <ChoiceGroup title="Qué te preocupa más" options={FEAR_OPTIONS} value={fear} onChange={setFear} compact />
      </div>

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <SelectField label="Tipo de piel" options={SKIN_OPTIONS} value={skinType} onChange={setSkinType} />
        <SelectField label="Tipo de cabello" options={HAIR_OPTIONS} value={hairType} onChange={setHairType} />
      </div>

      <label className="mt-7 flex items-start gap-3 rounded-lg border border-[#d8dee9] bg-[#f7f9fc] p-4">
        <input
          type="checkbox"
          checked={consentPersonalization}
          onChange={event => setConsentPersonalization(event.target.checked)}
          className="mt-1 h-4 w-4 rounded border-[#b9c4d5] text-[#2f6df6]"
        />
        <span className="text-sm leading-6 text-[#46546b]">
          Acepto que la app use estas respuestas para personalizar mi Beauty Plan, rutina y recomendaciones. No compraremos nada sin avisarte y podrás cambiar, exportar o borrar estos datos desde tu cuenta. Consulta la{' '}
          <Link href="/privacidad" className="font-bold text-[#2355c8] underline" target="_blank">
            politica de privacidad
          </Link>.
        </span>
      </label>

      {error && (
        <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-[#647089]">
          Recomendaciones de belleza no médica, con precios visibles y sin promesas imposibles.
        </p>
        <Button type="submit" loading={isPending} size="lg" className="shrink-0">
          Crear mi plan
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  )
}

function ChoiceButton({ option, selected, onClick }: { option: Option; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'min-h-24 rounded-lg border p-4 text-left transition-all',
        selected
          ? 'border-[#2f6df6] bg-[#e5edff] shadow-[0_16px_42px_rgba(47,109,246,0.14)]'
          : 'border-[#d8dee9] bg-white hover:border-[#b9c4d5] hover:bg-[#f7f9fc]'
      )}
    >
      <span className="flex items-start justify-between gap-3">
        <span>
          <span className="block font-black text-[#0c1324]">{option.label}</span>
          {option.description && <span className="mt-1 block text-sm leading-5 text-[#647089]">{option.description}</span>}
        </span>
        <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full border', selected ? 'border-[#2f6df6] bg-[#2f6df6] text-white' : 'border-[#c7d0dd] text-transparent')}>
          <Check className="h-3.5 w-3.5" />
        </span>
      </span>
    </button>
  )
}

function ChoiceGroup({
  title,
  options,
  value,
  onChange,
  compact = false,
}: {
  title: string
  options: Option[]
  value: string
  onChange: (value: string) => void
  compact?: boolean
}) {
  return (
    <fieldset>
      <legend className="mb-3 flex items-center gap-2 text-sm font-black text-[#0c1324]">
        <Sparkles className="h-4 w-4 text-[#2f6df6]" />
        {title}
      </legend>
      <div className={cn('grid gap-2', compact ? 'sm:grid-cols-2' : '')}>
        {options.map(option => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-md border px-3 py-2.5 text-left text-sm transition-all',
              value === option.value
                ? 'border-[#2f6df6] bg-[#e5edff] text-[#0c1324]'
                : 'border-[#d8dee9] bg-white text-[#46546b] hover:bg-[#f7f9fc]'
            )}
          >
            <span className="font-bold">{option.label}</span>
            {option.description && <span className="mt-0.5 block text-xs leading-5 text-[#647089]">{option.description}</span>}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

function SelectField({ label, options, value, onChange }: { label: string; options: Option[]; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-[#0c1324]">{label}</span>
      <select
        value={value}
        onChange={event => onChange(event.target.value)}
        className="w-full rounded-md border border-[#d8dee9] bg-white px-4 py-2.5 text-sm text-[#0c1324] outline-none transition focus:border-[#2f6df6] focus:ring-2 focus:ring-[#2f6df6]/15"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  )
}
