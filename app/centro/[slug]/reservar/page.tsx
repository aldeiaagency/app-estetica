import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Reservar cita',
  robots: { index: false },
}

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ paso?: string; servicio?: string; staff?: string }>
}

export default async function ReservarPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { paso: pasoStr } = await searchParams
  const paso = Number(pasoStr ?? 1)

  return (
    <div className="min-h-screen bg-[#fffaf7]">
      <div className="mx-auto max-w-[640px] px-4 py-12">
        <Link
          href={`/centro/${slug}`}
          className="mb-6 flex items-center gap-2 text-sm text-[#756b6b] hover:text-[#211b1c]"
        >
          ← Volver al centro
        </Link>

        <div className="mb-8">
          <div className="mb-2 flex justify-between text-xs text-[#756b6b]">
            <span>Paso {paso} de 5</span>
            <span>{STEP_NAMES[paso - 1]}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-[#eadfdc]">
            <div
              className="h-2 rounded-full bg-[#9d5c63] transition-all"
              style={{ width: `${(paso / 5) * 100}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-[#eadfdc] bg-white p-8">
          {paso === 1 && <StepServicio slug={slug} />}
          {paso === 2 && <StepProfesional slug={slug} />}
          {paso === 3 && <StepFecha slug={slug} />}
          {paso === 4 && <StepDatos slug={slug} />}
          {paso === 5 && <StepConfirmar slug={slug} />}
        </div>
      </div>
    </div>
  )
}

const STEP_NAMES = ['Servicio', 'Profesional', 'Fecha y hora', 'Tus datos', 'Confirmar']

function StepServicio({ slug }: { slug: string }) {
  return (
    <div>
      <h2 className="mb-6 text-xl font-black tracking-tight">¿Qué servicio buscas?</h2>
      <div className="space-y-3">
        {['Corte de pelo', 'Coloración', 'Manicura', 'Depilación'].map((servicio) => (
          <Link
            key={servicio}
            href={`/centro/${slug}/reservar?paso=2&servicio=${encodeURIComponent(servicio)}`}
            className="flex items-center justify-between rounded-xl border border-[#eadfdc] p-4 hover:border-[#9d5c63]"
          >
            <div>
              <p className="font-bold">{servicio}</p>
              <p className="text-sm text-[#756b6b]">60 min · desde 35 €</p>
            </div>
            <span className="text-[#9d5c63]">→</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

function StepProfesional({ slug }: { slug: string }) {
  return (
    <div>
      <h2 className="mb-6 text-xl font-black tracking-tight">¿Con quién prefieres?</h2>
      <Link
        href={`/centro/${slug}/reservar?paso=3`}
        className="flex items-center gap-4 rounded-xl border border-[#eadfdc] p-4 hover:border-[#9d5c63]"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f6ebe7] text-2xl">👥</div>
        <div>
          <p className="font-bold">Sin preferencia</p>
          <p className="text-sm text-[#756b6b]">El primero disponible</p>
        </div>
      </Link>
    </div>
  )
}

function StepFecha({ slug }: { slug: string }) {
  return (
    <div>
      <h2 className="mb-6 text-xl font-black tracking-tight">Elige fecha y hora</h2>
      <p className="mb-4 text-sm text-[#756b6b]">
        Calendario de disponibilidad — pendiente de conectar con el motor real.
      </p>
      <Link
        href={`/centro/${slug}/reservar?paso=4`}
        className="inline-block rounded-xl bg-[#9d5c63] px-6 py-3 font-bold text-white hover:bg-[#7a4650]"
      >
        Continuar (demo)
      </Link>
    </div>
  )
}

function StepDatos({ slug }: { slug: string }) {
  return (
    <div>
      <h2 className="mb-6 text-xl font-black tracking-tight">Tus datos</h2>
      <form className="space-y-4" action={`/centro/${slug}/reservar?paso=5`}>
        <div>
          <label className="mb-1.5 block text-sm font-bold">Nombre *</label>
          <input
            type="text"
            required
            className="w-full rounded-xl border border-[#eadfdc] px-4 py-3 text-sm outline-none focus:border-[#9d5c63]"
            placeholder="Tu nombre completo"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-bold">Email *</label>
          <input
            type="email"
            required
            className="w-full rounded-xl border border-[#eadfdc] px-4 py-3 text-sm outline-none focus:border-[#9d5c63]"
            placeholder="tu@email.com"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-bold">Teléfono</label>
          <input
            type="tel"
            className="w-full rounded-xl border border-[#eadfdc] px-4 py-3 text-sm outline-none focus:border-[#9d5c63]"
            placeholder="+34 600 000 000"
          />
        </div>
        <div className="flex items-start gap-3 rounded-xl bg-[#fffaf7] p-4">
          <input type="checkbox" required className="mt-0.5 h-4 w-4 accent-[#9d5c63]" />
          <label className="text-sm text-[#756b6b]">
            Acepto la <Link href="/legal/privacidad" className="underline">política de privacidad</Link>.
          </label>
        </div>
        <button type="submit" className="w-full rounded-xl bg-[#9d5c63] py-3 font-bold text-white hover:bg-[#7a4650]">
          Continuar
        </button>
      </form>
    </div>
  )
}

function StepConfirmar({ slug }: { slug: string }) {
  return (
    <div>
      <div className="mb-6 text-center">
        <div className="mb-3 text-5xl">✅</div>
        <h2 className="text-xl font-black tracking-tight">Confirma tu reserva</h2>
      </div>
      <div className="mb-6 rounded-xl bg-[#fffaf7] p-5 text-sm">
        <div className="flex justify-between py-2">
          <span className="text-[#756b6b]">Servicio</span>
          <span className="font-bold">Corte de pelo</span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-[#756b6b]">Profesional</span>
          <span className="font-bold">Sin preferencia</span>
        </div>
        <div className="flex justify-between py-2 text-base font-black">
          <span>Total</span>
          <span className="text-[#9d5c63]">35 €</span>
        </div>
      </div>
      <button className="w-full rounded-xl bg-[#9d5c63] py-4 font-bold text-white hover:bg-[#7a4650]">
        Confirmar reserva
      </button>
      <p className="mt-3 text-center text-xs text-[#756b6b]">
        Cancelación gratuita hasta 24h antes. Recibirás confirmación por email.
      </p>
    </div>
  )
}
