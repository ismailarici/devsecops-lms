import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CURRICULUM } from '@/lib/curriculum-data'
import { CurriculumPhaseSection } from '@/components/curriculum/phase-section'
import type { TopicProgress } from '@/lib/types'

export default async function CurriculumPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: progress } = await supabase
    .from('topic_progress')
    .select('*')
    .eq('user_id', user.id)

  const progressMap = new Map<string, TopicProgress>(
    (progress ?? []).map(p => [p.topic_key, p])
  )

  const totalTopics = CURRICULUM.reduce(
    (sum, p) => sum + p.topics.length + p.labs.length, 0
  )
  const completed = (progress ?? []).filter(p => p.status === 'complete').length

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Curriculum</h1>
          <p className="text-sm text-muted-foreground">
            {completed} of {totalTopics} topics complete
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {CURRICULUM.map(phase => (
          <CurriculumPhaseSection
            key={phase.phase}
            phase={phase}
            progressMap={progressMap}
          />
        ))}
      </div>
    </div>
  )
}
