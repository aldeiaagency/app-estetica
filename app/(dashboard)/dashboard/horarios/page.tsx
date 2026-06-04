import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { redirect } from 'next/navigation'
import { upsertScheduleRuleAction } from '@/app/actions/dashboard'

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export default async function HorariosPage() {
  const session = await auth()
  const orgId = session?.user?.organizationId
  if (!orgId) redirect('/auth/signin')

  const center = await prisma.center.findFirst({ where: { organizationId: orgId } })
  if (!center) redirect('/dashboard/configuracion')

  const rules = await prisma.scheduleRule.findMany({
    where: { centerId: center.id, staffId: null },
    orderBy: { dayOfWeek: 'asc' },
  })

  const rulesByDay = Object.fromEntries(rules.map((r) => [r.dayOfWeek, r]))

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Horarios</h1>
          <p className="mt-1 text-sm text-slate-500">Configura el horario de apertura del centro</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {DAYS.map((dayName, dayIndex) => {
            const rule = rulesByDay[dayIndex]

            return (
              <DayRow
                key={dayIndex}
                centerId={center.id}
                dayIndex={dayIndex}
                dayName={dayName}
                orgId={orgId}
                defaultActive={rule?.active ?? false}
                defaultOpen={rule?.openTime ?? '09:00'}
                defaultClose={rule?.closeTime ?? '19:00'}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

function DayRow({
  dayIndex,
  dayName,
  orgId,
  defaultActive,
  defaultOpen,
  defaultClose,
}: {
  centerId: string
  dayIndex: number
  dayName: string
  orgId: string
  defaultActive: boolean
  defaultOpen: string
  defaultClose: string
}) {
  async function handleSave(formData: FormData) {
    'use server'
    const active = formData.get('active') === 'on'
    const openTime = formData.get('openTime') as string
    const closeTime = formData.get('closeTime') as string

    await upsertScheduleRuleAction(
      { dayOfWeek: dayIndex, openTime, closeTime, active },
      orgId
    )
  }

  return (
    <form action={handleSave} className="flex flex-wrap items-center gap-4 px-6 py-4">
      <div className="flex items-center gap-3 w-32">
        <input
          type="checkbox"
          name="active"
          id={`active-${dayIndex}`}
          defaultChecked={defaultActive}
          className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
        />
        <label
          htmlFor={`active-${dayIndex}`}
          className="min-w-[80px] text-sm font-semibold text-slate-900 cursor-pointer"
        >
          {dayName}
        </label>
      </div>

      <div className="flex flex-1 flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-500 whitespace-nowrap">Apertura</label>
          <input
            type="time"
            name="openTime"
            defaultValue={defaultOpen}
            required
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-500 whitespace-nowrap">Cierre</label>
          <input
            type="time"
            name="closeTime"
            defaultValue={defaultClose}
            required
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
          />
        </div>
      </div>

      <button
        type="submit"
        className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
      >
        Guardar
      </button>
    </form>
  )
}
