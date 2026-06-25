import { afterEach, describe, expect, it } from 'vitest'
import { getPublicAppUrl } from '@/lib/config/app-url'

const originalNextPublicAppUrl = process.env.NEXT_PUBLIC_APP_URL
const originalAuthUrl = process.env.AUTH_URL

afterEach(() => {
  process.env.NEXT_PUBLIC_APP_URL = originalNextPublicAppUrl
  process.env.AUTH_URL = originalAuthUrl
})

describe('getPublicAppUrl', () => {
  it('uses the temporary production URL when the old Vercel URL is configured', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://app-estetica.vercel.app'
    process.env.AUTH_URL = ''

    expect(getPublicAppUrl()).toBe('https://app-estetica-one.vercel.app')
  })

  it('removes trailing slashes from the configured URL', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://bellezalocal.es/'

    expect(getPublicAppUrl()).toBe('https://bellezalocal.es')
  })
})
