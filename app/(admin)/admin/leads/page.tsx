import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { redirect } from 'next/navigation'

type LeadRow = {
  id: string
  businessName: string
  contactName: string | null
  email: string
  phone: string | null
  city: string | null
  plan: string | null
  message: string | null
  status: string
  source: string
  createdAt: Date
}

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Nuevo',
  CONTACTED: 'Contactado',
  QUALIFIED: 'Cualificado',
  WON: 'Convertido',
  LOST: 'Perdido',
  ARCHIVED: 'Archivado',
}

export default async function AdminLeadsPage() {
  const session = await auth()
  if (session?.user?.role !== 'PLATFORM_ADMIN') redirect('/')

  const leads = await prisma.$queryRaw<LeadRow[]>`
    SELECT
      "id",
      "businessName",
      "contactName",
      "email",
      "phone",
      "city",
      "plan",
      "message",
      "status"::text AS "status",
      "source",
      "createdAt"
    FROM "Lead"
    ORDER BY "createdAt" DESC
    LIMIT 100
  `

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-zinc-900">Leads B2B</h1>
        <p className="mt-1 text-sm text-zinc-500">Solicitudes recibidas desde la pagina para negocios.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-6 py-4">
          <h2 className="font-bold text-zinc-900">{leads.length} solicitudes recientes</h2>
        </div>

        {leads.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-zinc-400">
            Aun no hay leads registrados.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {leads.map(lead => (
              <article key={lead.id} className="grid gap-4 px-6 py-5 lg:grid-cols-[1.1fr_0.8fr_1.1fr]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black text-zinc-900">{lead.businessName}</h3>
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                      {STATUS_LABELS[lead.status] ?? lead.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-500">
                    {lead.contactName ? `${lead.contactName} · ` : ''}{lead.city ?? 'Ciudad sin indicar'}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(lead.createdAt))}
                  </p>
                </div>

                <div className="text-sm text-zinc-600">
                  <p><span className="font-semibold text-zinc-900">Email:</span> {lead.email}</p>
                  {lead.phone && <p className="mt-1"><span className="font-semibold text-zinc-900">Telefono:</span> {lead.phone}</p>}
                  {lead.plan && <p className="mt-1"><span className="font-semibold text-zinc-900">Plan:</span> {lead.plan}</p>}
                </div>

                <div className="rounded-xl bg-zinc-50 p-4 text-sm leading-6 text-zinc-600">
                  {lead.message || 'Sin mensaje adicional.'}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
