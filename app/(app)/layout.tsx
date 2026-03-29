import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  // Get profile for current phase
  const { data: profile } = await supabase
    .from('profiles')
    .select('current_phase')
    .eq('id', user.id)
    .single()

  const currentPhase = profile?.current_phase ?? 1

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar currentPhase={currentPhase} />
      <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
        {children}
      </main>
      <MobileNav />
    </div>
  )
}
