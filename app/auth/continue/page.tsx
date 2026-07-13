import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/config'

export default async function AuthContinuePage() {
  const session = await auth()

  if (!session?.user) redirect('/auth/signin')
  if (session.user.role === 'PLATFORM_ADMIN') redirect('/admin')
  if (['BUSINESS', 'BUSINESS_ADMIN'].includes(session.user.role)) redirect('/dashboard')
  redirect('/cuenta')
}
