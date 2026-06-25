'use client'

import { useActionState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'
import { submitBusinessLead, type LeadFormState } from '@/app/actions/leads'

const PLAN_OPTIONS = [
  { value: '', label: 'No lo tengo claro todavia' },
  { value: 'presencia', label: 'Presencia' },
  { value: 'growth', label: 'Growth' },
  { value: 'elite', label: 'Elite' },
  { value: 'partner', label: 'Partner' },
]

export function LeadForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const [state, action, pending] = useActionState<LeadFormState | null, FormData>(submitBusinessLead, null)

  useEffect(() => {
    if (state?.success) formRef.current?.reset()
  }, [state?.success])

  return (
    <form ref={formRef} action={action} className="mt-8 rounded-lg border border-white/12 bg-white/[0.06] p-5 text-left shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
      {state?.success && (
        <div className="mb-5 flex gap-3 rounded-md border border-emerald-300/30 bg-emerald-400/12 px-4 py-3 text-sm text-emerald-50">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.message}</span>
        </div>
      )}

      {state?.error && (
        <div className="mb-5 rounded-md border border-red-300/30 bg-red-400/12 px-4 py-3 text-sm text-red-50">
          {state.error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-bold uppercase tracking-[0.14em] text-white/58">Negocio</label>
          <input name="businessName" required className="mt-1.5 w-full rounded-md border border-white/15 bg-white px-3 py-2.5 text-sm font-semibold text-[#0c1324] outline-none transition focus:border-[#9db8ff]" placeholder="Nombre del centro" />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-[0.14em] text-white/58">Contacto</label>
          <input name="contactName" className="mt-1.5 w-full rounded-md border border-white/15 bg-white px-3 py-2.5 text-sm font-semibold text-[#0c1324] outline-none transition focus:border-[#9db8ff]" placeholder="Tu nombre" />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-[0.14em] text-white/58">Email</label>
          <input name="email" type="email" required className="mt-1.5 w-full rounded-md border border-white/15 bg-white px-3 py-2.5 text-sm font-semibold text-[#0c1324] outline-none transition focus:border-[#9db8ff]" placeholder="tu@email.com" />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-[0.14em] text-white/58">Telefono</label>
          <input name="phone" type="tel" className="mt-1.5 w-full rounded-md border border-white/15 bg-white px-3 py-2.5 text-sm font-semibold text-[#0c1324] outline-none transition focus:border-[#9db8ff]" placeholder="+34 600 000 000" />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-[0.14em] text-white/58">Ciudad</label>
          <input name="city" className="mt-1.5 w-full rounded-md border border-white/15 bg-white px-3 py-2.5 text-sm font-semibold text-[#0c1324] outline-none transition focus:border-[#9db8ff]" placeholder="Madrid" />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-[0.14em] text-white/58">Plan de interes</label>
          <select name="plan" className="mt-1.5 w-full rounded-md border border-white/15 bg-white px-3 py-2.5 text-sm font-semibold text-[#0c1324] outline-none transition focus:border-[#9db8ff]">
            {PLAN_OPTIONS.map(option => (
              <option key={option.value || 'empty'} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4">
        <label className="text-xs font-bold uppercase tracking-[0.14em] text-white/58">Prioridad</label>
        <textarea name="message" rows={4} className="mt-1.5 w-full rounded-md border border-white/15 bg-white px-3 py-2.5 text-sm font-semibold text-[#0c1324] outline-none transition focus:border-[#9db8ff]" placeholder="Reservas, packs, productos, recurrencia, migracion..." />
      </div>

      <label className="mt-4 flex items-start gap-3 rounded-md bg-white/8 p-3 text-xs leading-5 text-white/70">
        <input name="consentAccepted" required type="checkbox" className="mt-0.5 h-4 w-4 accent-[#9db8ff]" />
        <span>
          Acepto que Belleza Local use estos datos para responder a la solicitud, segun la{' '}
          <Link href="/privacidad" className="font-bold text-white underline">politica de privacidad</Link>.
        </span>
      </label>

      <button type="submit" disabled={pending} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-black text-[#0c1324] transition hover:bg-[#e5edff] disabled:cursor-not-allowed disabled:opacity-70">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        Enviar solicitud
      </button>
    </form>
  )
}
