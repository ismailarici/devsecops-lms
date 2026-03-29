import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StudyLogClient } from '@/components/log/study-log-client'

export default async function StudyLogPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: sessions } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(60)

  return <StudyLogClient initialSessions={sessions ?? []} />
}
