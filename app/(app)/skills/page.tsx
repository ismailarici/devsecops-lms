import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SKILL_CATEGORIES, DEPTH_LABELS } from '@/lib/curriculum-data'
import { SkillsClient } from '@/components/skills/skills-client'

export default async function SkillsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  // Get latest assessment per skill
  const { data: assessments } = await supabase
    .from('skill_assessments')
    .select('*')
    .eq('user_id', user.id)
    .order('assessed_at', { ascending: false })

  // Build map of skill_key -> latest level
  const skillMap = new Map<string, number>()
  for (const a of assessments ?? []) {
    if (!skillMap.has(a.skill_key)) skillMap.set(a.skill_key, a.level)
  }

  const skills = SKILL_CATEGORIES.map(cat => ({
    ...cat,
    level: skillMap.get(cat.key) ?? 0,
  }))

  return <SkillsClient initialSkills={skills} depthLabels={DEPTH_LABELS} />
}
