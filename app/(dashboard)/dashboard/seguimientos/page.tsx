import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { redirect } from 'next/navigation'
import { CalendarClock, CheckCircle2, Mail, MessageSquareText, Pause, Play, Send, X } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'
import {
  createFollowUpTemplateAction,
  ensureStarterFollowUpTemplatesForCenter,
  getFollowUpMessagesForOrganization,
  getFollowUpTemplatesForOrganization,
  toggleFollowUpTemplateActiveAction,
  updateFollowUpMessageStatusAction,
  type CommunicationPurpose,
  type FollowUpMessageStatus,
} from '@/app/actions/follow-ups'

const CATEGORY_LABELS: Record<string, string> = {
  GENERIC: 'General',
  MANICURE: 'Manicura',
  FACIAL: 'Facial',
  COLORATION: 'Coloracion',
  BROWS_LASHES: 'Cejas y pestanas',
  WELLNESS: 'Bienestar',
}

const PURPOSE_LABELS: Record<CommunicationPurpose, string> = {
  TRANSACTIONAL: 'Transaccional',
  FOLLOW_UP: 'Seguimiento',
  MARKETING: 'Marketing',
}

const STATUS_LABELS: Record<FollowUpMessageStatus, string> = {
  SCHEDULED: 'Programado',
  READY: 'Listo',
  SENT: 'Enviado',
  DISMISSED: 'Descartado',
  CANCELLED: 'Cancelado',
  FAILED: 'Fallido',
}

export default async function SeguimientosPage() {
  const session = await auth()
  const orgId = session?.user?.organizationId
  if (!orgId) redirect('/auth/signin')

  const center = await prisma.center.findFirst({ where: { organizationId: orgId }, select: { id: true, name: true } })
  if (!center) redirect('/dashboard/configuracion')

  await ensureStarterFollowUpTemplatesForCenter(center.id)

  const [templates, messages] = await Promise.all([
    getFollowUpTemplatesForOrganization(orgId),
    getFollowUpMessagesForOrganization(orgId, 60),
  ])

  const pendingMessages = messages.filter(message => message.status === 'SCHEDULED' || message.status === 'READY')
  const followUpTemplates = templates.filter(template => template.purpose === 'FOLLOW_UP')

  async function handleCreateTemplate(formData: FormData) {
    'use server'

    await createFollowUpTemplateAction({
      name: String(formData.get('name') ?? ''),
      category: String(formData.get('category') ?? 'GENERIC'),
      purpose: String(formData.get('purpose') ?? 'FOLLOW_UP'),
      channel: String(formData.get('channel') ?? 'EMAIL'),
      serviceKeyword: String(formData.get('serviceKeyword') ?? '').trim() || undefined,
      subject: String(formData.get('subject') ?? ''),
      body: String(formData.get('body') ?? ''),
      sendAfterDays: parseInt(String(formData.get('sendAfterDays') ?? '14'), 10),
      consentRequired: formData.get('consentRequired') === '1',
    })
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">Seguimientos</h1>
          <p className="mt-1 text-sm text-zinc-500">Mensajes utiles tras una visita completada, separados de campanas promocionales.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          Email e in-app preparados como canales MVP
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard icon={MessageSquareText} label="Plantillas activas" value={templates.filter(t => t.active).length} />
        <MetricCard icon={CalendarClock} label="Mensajes pendientes" value={pendingMessages.length} />
        <MetricCard icon={Mail} label="Plantillas de seguimiento" value={followUpTemplates.length} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-5">
          <div className="rounded-lg border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-100 px-5 py-4">
              <h2 className="font-black text-zinc-900">Plantillas</h2>
              <p className="mt-1 text-xs text-zinc-500">Manicura, facial, coloracion y seguimiento general quedan listas al entrar.</p>
            </div>

            {templates.length === 0 ? (
              <EmptyBlock title="Sin plantillas disponibles" text="Se crearan al aplicar la migracion de seguimiento." />
            ) : (
              <div className="divide-y divide-zinc-100">
                {templates.map(template => (
                  <article key={template.id} className="px-5 py-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">
                            {CATEGORY_LABELS[template.category]}
                          </span>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-black ${template.purpose === 'MARKETING' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                            {PURPOSE_LABELS[template.purpose]}
                          </span>
                          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-600">{template.channel}</span>
                          {template.consentRequired && (
                            <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-black text-red-700">Requiere opt-in</span>
                          )}
                        </div>
                        <h3 className="mt-3 font-black text-zinc-900">{template.name}</h3>
                        <p className="mt-1 text-sm font-semibold text-zinc-600">{template.subject}</p>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">{template.body}</p>
                        <p className="mt-2 text-xs font-semibold text-zinc-400">
                          {template.serviceKeyword ? `Cuando el servicio contenga "${template.serviceKeyword}"` : 'Disponible para cualquier servicio'} · {template.sendAfterDays} dias despues
                        </p>
                      </div>
                      <form action={async () => {
                        'use server'
                        await toggleFollowUpTemplateActiveAction(template.id)
                      }}>
                        <button type="submit" className="btn-outline py-2 text-xs">
                          {template.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          {template.active ? 'Pausar' : 'Activar'}
                        </button>
                      </form>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-100 px-5 py-4">
              <h2 className="font-black text-zinc-900">Mensajes programados</h2>
              <p className="mt-1 text-xs text-zinc-500">Bandeja operativa para revisar y marcar seguimiento como enviado.</p>
            </div>

            {messages.length === 0 ? (
              <EmptyBlock title="Sin mensajes programados" text="Se generaran al completar reservas o desde oportunidades de recurrencia." />
            ) : (
              <div className="divide-y divide-zinc-100">
                {messages.map(message => (
                  <article key={message.id} className="px-5 py-4">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge status={message.status} />
                          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-600">{PURPOSE_LABELS[message.purpose]}</span>
                          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-600">{message.channel}</span>
                        </div>
                        <h3 className="mt-3 font-black text-zinc-900">{message.subject}</h3>
                        <p className="mt-1 text-sm text-zinc-500">
                          {message.customerName} · {message.serviceName ?? 'Sin servicio asociado'}
                        </p>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">{message.body}</p>
                        <p className="mt-2 text-xs font-semibold text-zinc-400">
                          Programado para {formatDate(message.scheduledFor, { day: 'numeric', month: 'short', year: 'numeric' })} a las {formatTime(message.scheduledFor)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <form action={async () => {
                          'use server'
                          await updateFollowUpMessageStatusAction(message.id, 'SENT')
                        }}>
                          <button type="submit" className="btn-primary py-2 text-xs" disabled={message.status === 'SENT'}>
                            <Send className="h-4 w-4" />
                            Enviado
                          </button>
                        </form>
                        <form action={async () => {
                          'use server'
                          await updateFollowUpMessageStatusAction(message.id, 'DISMISSED')
                        }}>
                          <button type="submit" className="btn-outline py-2 text-xs" disabled={message.status === 'DISMISSED'}>
                            <X className="h-4 w-4" />
                            Descartar
                          </button>
                        </form>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="font-black text-zinc-900">Nueva plantilla</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-500">Usa variables como {'{customerName}'}, {'{serviceName}'} y {'{centerName}'}.</p>

          <form action={handleCreateTemplate} className="mt-5 space-y-4">
            <div>
              <label className="label">Nombre</label>
              <input name="name" required minLength={3} className="input-base" placeholder="Revision de cejas a 21 dias" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Categoria</label>
                <select name="category" className="input-base">
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Canal</label>
                <select name="channel" className="input-base">
                  <option value="EMAIL">Email</option>
                  <option value="IN_APP">In-app</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Tipo</label>
              <select name="purpose" className="input-base">
                <option value="FOLLOW_UP">Seguimiento util</option>
                <option value="MARKETING">Marketing con opt-in</option>
              </select>
            </div>
            <div>
              <label className="label">Palabra del servicio</label>
              <input name="serviceKeyword" className="input-base" placeholder="facial, manic, color..." />
            </div>
            <div>
              <label className="label">Dias despues</label>
              <input name="sendAfterDays" type="number" min={0} max={365} defaultValue={14} className="input-base" />
            </div>
            <div>
              <label className="label">Asunto</label>
              <input name="subject" required minLength={3} className="input-base" placeholder="Como va tu resultado, {customerName}?" />
            </div>
            <div>
              <label className="label">Mensaje</label>
              <textarea name="body" required minLength={10} rows={6} className="input-base resize-none" placeholder="Hola {customerName}, queremos revisar como va {serviceName}..." />
            </div>
            <label className="flex items-start gap-3 rounded-md bg-zinc-50 p-3 text-sm font-semibold text-zinc-700">
              <input name="consentRequired" type="checkbox" value="1" className="mt-1 h-4 w-4 accent-[#2f6df6]" />
              Requiere consentimiento de marketing
            </label>
            <button type="submit" className="btn-primary w-full justify-center">
              Crear plantilla
            </button>
          </form>
        </aside>
      </section>
    </div>
  )
}

function MetricCard({ icon: Icon, label, value }: { icon: typeof MessageSquareText; label: string; value: number }) {
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

function EmptyBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="px-5 py-10 text-center">
      <p className="font-bold text-zinc-700">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-zinc-400">{text}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: FollowUpMessageStatus }) {
  const cls = {
    SCHEDULED: 'bg-blue-50 text-blue-700',
    READY: 'bg-emerald-50 text-emerald-700',
    SENT: 'bg-zinc-100 text-zinc-600',
    DISMISSED: 'bg-amber-50 text-amber-700',
    CANCELLED: 'bg-zinc-100 text-zinc-500',
    FAILED: 'bg-red-50 text-red-700',
  }[status]

  return <span className={`rounded-full px-2.5 py-1 text-xs font-black ${cls}`}>{STATUS_LABELS[status]}</span>
}
