import { SignInForm } from '@/components/auth/signin-form'

function safeCallbackUrl(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value
  return candidate?.startsWith('/') && !candidate.startsWith('//') ? candidate : '/auth/continue'
}

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string | string[] }> }) {
  const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET)
  const params = await searchParams
  return <SignInForm googleEnabled={googleEnabled} callbackUrl={safeCallbackUrl(params.callbackUrl)} />
}
