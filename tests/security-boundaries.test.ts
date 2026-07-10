import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8')
}

describe('security invariants', () => {
  it('derives the dashboard tenant from the authenticated session', async () => {
    const dashboard = await source('app/actions/dashboard.ts')
    expect(dashboard).toContain("import { requireOrganization }")
    expect(dashboard).toContain('await getBusinessContext()')
    expect(dashboard).not.toMatch(/\bconst\s*\{?\s*orgId\s*\}?\s*=\s*_legacyOrganizationId/)
    expect(dashboard).not.toMatch(/organizationId:\s*_legacyOrganizationId/)
  })

  it('does not trust client-provided booking end timestamps', async () => {
    const booking = await source('app/actions/booking.ts')
    const createSchema = booking.slice(
      booking.indexOf('const createBookingSchema'),
      booking.indexOf('export type CreateBookingInput'),
    )
    const rescheduleSchema = booking.slice(
      booking.indexOf('const rescheduleSchema'),
      booking.indexOf('export async function rescheduleBookingAction'),
    )
    expect(createSchema).not.toContain('endAt:')
    expect(rescheduleSchema).not.toContain('newEndAt:')
    expect(booking).toContain('resolveBookableSlot')
  })

  it('fails closed on unknown Stripe subscription prices', async () => {
    const webhook = await source('app/api/webhooks/stripe/route.ts')
    expect(webhook).toContain('UNKNOWN_SUBSCRIPTION_PRICE')
    expect(webhook).not.toMatch(/\?\?\s*['"]PRO['"]/)
  })
})
