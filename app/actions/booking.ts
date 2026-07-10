'use server'

import { randomInt } from 'node:crypto'
import { addMinutes } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import { sendBookingConfirmation } from '@/lib/notifications/email'
import { notifyWaitlistForBookingOpening } from '@/lib/waitlist/notifications'
import { create