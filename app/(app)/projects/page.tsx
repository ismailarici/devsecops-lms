import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PORTFOLIO_PROJECTS } from '@/lib/curriculum-data'
import { ProjectsClient } from '@/components/projects/projects-client'

export default async function ProjectsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)

  return (
    <ProjectsClient
      projects={projects ?? []}
      portfolioProjects={PORTFOLIO_PROJECTS}
    />
  )
}
