import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Mail, Megaphone, Send, ShieldAlert, ShieldCheck, Users } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'
import { createMarketingCampaignAction, getFollowUpMessagesForOrganization, updateFollowUpMessageStatusAction } from '@/app/actions/follow-ups'

export default async function CampanasPage() {
  const session = await auth()
  const orgId = session?.user?.organizationId
  if (!orgId) redirect('/auth/signin')

  const center = await prisma.center.findFirst({ where: { organizationId: orgId }, select: { id: true } })
  if (!center) redirect('/dashboard/configuracion')

  const [totalCustomers, optInCustomers, allMessages] = await Promise.all([
    prisma.customer.count({ where: { centerId: center.id } }),
    prisma.customer.count({ where: { centerId: center.id, marketingConsent: true } }),
    getFollowUpMessagesForOrganization(orgId, 120),
  ])

  const marketingMessages = allMessages.filter(message => message.purpose === 'MARKETING')
  const pendingMarketing = marketingMessages.filter(message => message.status === 'SCHEDULED' || message.status === 'READY')

  async function handleCreateCampaign(formData: FormData) {
    'use server'

    const rawDate = String(formData.get('scheduledFor') ?? '').trim()
    await createMarketingCampaignAction({
      subject: String(formData.get('subject') ?? ''),
      body: String(formData.get('body') ?? ''),
      channel: String(formData.get('channel') ?? 'EMAIL'),
      scheduledFor: rawDate ? new Date(rawDate) : undefined,
    })
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">Campanas</h1>
          <p className="mt-1 text-sm text-zinc-500">Comunicaciones promocionales separadas del seguimiento util y solo con opt-in.</p>
        </div>
        <Link href="/dashboard/seguimientos" className="btn-outline py-2 text-xs">
          Plantillas de seguimiento
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard icon={Users} label="Clientes" value={totalCustomers} />
        <MetricCard icon={ShieldCheck} label="Con opt-in" value={optInCustomers} />
        <MetricCard icon={Megaphone} label="Campanas programadas" value={pendingMarketing.length} />
        <MetricCard icon={Mail} label="Mensajes marketing" value={marketingMessages.length} />
      </section>

      <section className="rounded-lg border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div>
            <h2 className="font-black text-amber-950">Regla de consentimiento</h2>
            <p className="mt-1 text-sm leading-6 text-amber-800">
              Esta pantalla solo programa mensajes para clientas con consentimiento de marketing. Los seguimientos postservicio viven en otra bandeja y no se usan como promocion.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <aside className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="font-black text-zinc-900">Nueva campana</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-500">
            Se programara para {optInCustomers} cliente{optInCustomers === 1 ? '' : 's'} con opt-in.
          </p>

          <form action={handleCreateCampaign} className="mt-5 space-y-4">
            <div>
              <label className="label">Canal</label>
              <select name="channel" className="input-base">
                <option value="EMAIL">Email</option>
                <option value="IN_APP">In-app</option>
              </select>
            </div>
            <div>
              <label className="label">Programar para</label>
              <input name="scheduledFor" type="datetime-local" className="input-base" />
            </div>
            <div>
              <label className="label">Asunto</label>
              <input name="subject" required minLength={3} className="input-base" placeholder="Nueva disponibilidad esta semana" />
            </div>
            <div>
              <label className="label">Mensaje</label>
              <textarea
                name="body"
                required
                minLength={10}
                rows={7}
                className="input-base resize-none"
                placeholder="Hola {customerName}, tenemos nuevas horas disponibles en {centerName}..."
              />
            </div>
            <button type="submit" className="btn-primary w-full justify-center" disabled={optInCustomers === 0}>
              <Megaphone className="h-4 w-4" />
              Programar campana
            </button>
          </form>
        </aside>

        <div className="rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-100 px-5 py-4">
            <h2 className="font-black text-zinc-900">Mensajes promocionales</h2>
            <p className="mt-1 text-xs text-zinc-500">Bandeja separada de marketing.</p>
          </div>

          {marketingMessages.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <Megaphone className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
              <p className="font-bold text-zinc-700">Sin campanas creadas</p>
              <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-zinc-400">
                Crea una campana cuando tengas una comunicacion promocional clara y base con opt-in suficiente.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {marketingMessages.map(message => (
                <article key={message.id} className="px-5 py-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700">Marketing</span>
                        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-600">{message.channel}</span>
                        {message.marketingConsent ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Opt-in
                          </span>
                        ) : (
                          <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-black text-red-700">Sin opt-in</span>
                        )}
                      </div>
                      <h3 className="mt-3 font-black text-zinc-900">{message.subject}</h3>
                      <p className="mt-1 text-sm text-zinc-500">{message.customerName} · {message.customerEmail}</p>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">{message.body}</p>
                      <p className="mt-2 text-xs font-semibold text-zinc-400">
                        {formatDate(message.scheduledFor, { day: 'numeric', month: 'short', year: 'numeric' })} · {formatTime(message.scheduledFor)}
                      </p>
                    </div>
                    <form action={async () => {
                      'use server'
                      await updateFollowUpMessageStatusAction(message.id, 'SENT')
                    }}>
                      <button type="submit" className="btn-primary py-2 text-xs" disabled={message.status === 'SENT' || !message.marketingConsent}>
                        <Send className="h-4 w-4" />
                        Marcar enviado
                      </button>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function MetricCard({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-700">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-3xl font-black tracking-tight text-zinc-900">{value}</p>
      <p className="mt-1 text-sm font-bold text-zinc-600">{label}</p>
    </div>
  )
}
