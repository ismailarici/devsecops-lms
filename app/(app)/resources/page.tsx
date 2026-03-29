import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CURRICULUM } from '@/lib/curriculum-data'
import { ResourcesClient, type FlatResource, type CustomResource } from '@/components/resources/resources-client'
import type { ResourceStatus } from '@/lib/types'

export default async function ResourcesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  // Flatten all curriculum resources
  const flat: FlatResource[] = []
  for (const phase of CURRICULUM) {
    for (const topic of phase.topics) {
      topic.resources.forEach((r, idx) => {
        flat.push({
          key: `${topic.key}__${idx}`,
          title: r.title,
          url: r.url,
          type: r.type,
          isFree: r.isFree,
          priority: r.priority,
          note: r.note,
          phase: phase.phase,
          phaseTitle: phase.title,
          topicTitle: topic.title,
          status: 'not_started',
        })
      })
    }
    for (const lab of phase.labs) {
      lab.resources.forEach((r, idx) => {
        flat.push({
          key: `${lab.key}__${idx}`,
          title: r.title,
          url: r.url,
          type: r.type,
          isFree: r.isFree,
          priority: r.priority,
          note: r.note,
          phase: phase.phase,
          phaseTitle: phase.title,
          topicTitle: lab.title,
          status: 'not_started',
        })
      })
    }
  }

  // Fetch curriculum resource statuses and custom resources in parallel
  const [{ data: saved }, { data: custom }] = await Promise.all([
    supabase.from('resource_progress').select('resource_key, status').eq('user_id', user.id),
    supabase.from('resources').select('*').eq('user_id', user.id).eq('is_custom', true).order('created_at', { ascending: false }),
  ])

  const statusMap = new Map<string, ResourceStatus>(
    (saved ?? []).map(r => [r.resource_key, r.status as ResourceStatus])
  )

  const customResources: CustomResource[] = (custom ?? []).map(r => ({
    id: r.id,
    title: r.title,
    url: r.url,
    category: r.category,
    priority: r.priority,
    isFree: r.is_free,
    notes: r.notes,
    status: r.status as ResourceStatus,
  }))

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-1">Resources Library</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Curated curriculum resources plus your own. Track what you&apos;ve read.
      </p>
      <ResourcesClient resources={flat} statusMap={statusMap} customResources={customResources} />
    </div>
  )
}
