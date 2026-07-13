import { getFeatureFlags } from '@/lib/features/flags'
import { PublicHeaderClient } from '@/components/ui/public-header-client'

export function PublicHeader({ theme = 'light' }: { theme?: 'light' | 'dark' }) {
  return <PublicHeaderClient theme={theme} features={getFeatureFlags()} />
}
