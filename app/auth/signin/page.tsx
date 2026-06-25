import { SignInForm } from '@/components/auth/signin-form'

export default function SignInPage() {
  const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET)
  return <SignInForm googleEnabled={googleEnabled} />
}
