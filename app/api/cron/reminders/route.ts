import { NextRequest, NextResponse } from 'next/server'
import { fromZonedTime, toZonedTime } from 'date-fns-tz'
import { prisma } from '@/lib/db/client'
import { sendBookingReminder } from '@/lib/email/templates'
import { formatDate } from '@/lib/utils'
import { isEmailConfigured } from '@/lib/email/client'
import { isWhatsAppConfigured, sendBookingReminderWhatsApp } from '@/lib/notifications/whatsapp'

const TIMEZONE = 'Europe/Madrid'

function getTomorrowWindow() {
  const nowMadrid = toZonedTime(new Date(), TIMEZONE)
  const startLocal = new Date(nowMadrid)
  startLocal.setDate(nowMadrid.getDate() + 1)
  startLocal.setHours(0, 0, 0, 0)

  const endLocal = new Date(startLocal)
  endLocal.setHours(23, 59, 59, 999)

  return {
    start: fromZonedTime(startLocal, TIMEZONE),
    end: fromZonedTime(endLocal, TIMEZONE),
  }
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET no configurado' }, { status: 500 })
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const emailConfigured = isEmailConfigured()
  const whatsappConfigured = isWhatsAppConfigured()
  if (!emailConfigured && !whatsappConfigured) {
    return NextResponse.json({
      ok: true,
      emailConfigured,
      whatsappConfigured,
      total: 0,
      sent: 0,
      failed: 0,
      skippedReason: 'No hay canal de recordatorio configurado',
    })
  }

  const { start, end } = getTomorrowWindow()
  const bookings = await prisma.booking.findMany({
    where: {
      status: 'CONFIRMED',
      OR: [
        { reminderSentAt: null },
        {
          customer: {
            whatsappConsent: true,
            whatsappOptedOutAt: null,
            phone: { not: null },
          },
          whatsappReminderSentAt: null,
        },
      ],
      startAt: { gte: start, lte: end },
    },
    include: {
      center: { select: { name: true, slug: true } },
      service: { select: { name: true } },
      staff: { select: { name: true } },
      customer: { select: { name: true, email: true, phone: true, whatsappConsent: true, whatsappOptedOutAt: true } },
    },
    orderBy: { startAt: 'asc' },
    take: 200,
  })

  let sent = 0
  let whatsappSent = 0
  let failed = 0

  for (const booking of bookings) {
    const sharedParams = {
      customerName: booking.customer.name,
      serviceName: booking.service.name,
      centerName: booking.center.name,
      centerSlug: booking.center.slug,
      date: formatDate(booking.startAt, {
        day: 'numeric', month: 'long', year: 'numeric', timeZone: TIMEZONE,
      }),
      time: booking.startAt.toLocaleTimeString('es-ES', {
        hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE,
      }),
      staffName: booking.staff?.name ?? null,
    }

    if (emailConfigured && !booking.reminderSentAt) {
      const claimed = await prisma.booking.updateMany({
        where: {
          id: booking.id,
          reminderSentAt: null,
          OR: [{ reminderClaimedAt: null }, { reminderClaimedAt: { lt: new Date(Date.now() - 15 * 60 * 1000) } }],
        },
        data: { reminderClaimedAt: new Date(), reminderAttempts: { increment: 1 } },
      })
      if (claimed.count === 1) {
        try {
          await sendBookingReminder({ to: booking.customer.email, ...sharedParams })
          await prisma.booking.update({ where: { id: booking.id }, data: { reminderSentAt: new Date(), reminderClaimedAt: null } })
          sent += 1
        } catch (err) {
          await prisma.booking.update({ where: { id: booking.id }, data: { reminderClaimedAt: null } })
          failed += 1
          console.error('[cron/reminders] Failed to send email reminder:', booking.id, err)
        }
      }
    }

    if (whatsappConfigured && booking.customer.whatsappConsent && booking.customer.phone && !booking.customer.whatsappOptedOutAt && !booking.whatsappReminderSentAt) {
      const claimed = await prisma.booking.updateMany({
        where: {
          id: booking.id,
          whatsappReminderSentAt: null,
          OR: [{ whatsappReminderClaimedAt: null }, { whatsappReminderClaimedAt: { lt: new Date(Date.now() - 15 * 60 * 1000) } }],
        },
        data: { whatsappReminderClaimedAt: new Date(), whatsappReminderAttempts: { increment: 1 } },
      })
      if (claimed.count === 1) {
        try {
          const delivery = await sendBookingReminderWhatsApp({
            to: booking.customer.phone,
            customerName: booking.customer.name,
            centerName: booking.center.name,
            date: sharedParams.date,
            time: sharedParams.time,
            confirmationCode: booking.confirmationCode,
            customerEmail: booking.customer.email,
          })
          if (delivery.messageId) {
            await prisma.whatsAppDelivery.create({
              data: {
                providerMessageId: delivery.messageId,
                bookingId: booking.id,
                customerId: booking.customerId,
                status: 'SENT',
              },
            })
          }
          await prisma.booking.update({ where: { id: booking.id }, data: { whatsappReminderSentAt: new Date(), whatsappReminderClaimedAt: null } })
          whatsappSent += 1
        } catch (err) {
          await prisma.booking.update({ where: { id: booking.id }, data: { whatsappReminderClaimedAt: null } })
          failed += 1
          console.error('[cron/reminders] Failed to send WhatsApp reminder:', booking.id, err)
        }
      }
    }
  }

  return NextResponse.json({
    ok: true,
    window: { start: start.toISOString(), end: end.toISOString() },
    total: bookings.length,
    sent,
    whatsappSent,
    failed,
    emailConfigured,
    whatsappConfigured,
  })
}
