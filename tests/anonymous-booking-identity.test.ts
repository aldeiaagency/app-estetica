import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

async function bookingSource() {
  return readFile(new URL('../app/actions/booking.ts', import.meta.url), 'utf8')
}

describe('anonymous booking identity', () => {
  it('does not overwrite an existing customer from a booking or waitlist request', async () => {
    const source = await bookingSource()
    const upserts = source.split('const customer = await tx.customer.upsert({').slice(1)

    expect(upserts).toHaveLength(2)
    for (const upsert of upserts) {
      const customerWrite = upsert.slice(0, upsert.indexOf('\n      })'))
      expect(customerWrite).toContain('update: {}')
      expect(customerWrite).not.toMatch(/update:\s*\{[\s\S]*?name:/)
      expect(customerWrite).not.toMatch(/update:\s*\{[\s\S]*?phone:/)
      expect(customerWrite).not.toMatch(/update:\s*\{[\s\S]*?marketingConsent:/)
    }
  })

  it('does not grant marketing consent before a double opt-in exists', async () => {
    const source = await bookingSource()
    const upserts = source.split('const customer = await tx.customer.upsert({').slice(1)

    for (const upsert of upserts) {
      const customerWrite = upsert.slice(0, upsert.indexOf('\n      })'))
      expect(customerWrite).toContain('marketingConsent: false')
      expect(customerWrite).toContain('marketingConsentDate: null')
      expect(customerWrite).not.toContain('marketingConsent: data.marketingConsent')
    }
  })
})
