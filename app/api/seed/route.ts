import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CURRICULUM, PORTFOLIO_PROJECTS, SKILL_CATEGORIES } from '@/lib/curriculum-data'

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if already seeded
  const { data: existing } = await supabase
    .from('topic_progress')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)

  if (existing && existing.length > 0) {
    return NextResponse.json({ message: 'Already seeded' })
  }

  // 1. Create profile
  await supabase.from('profiles').upsert({
    id: user.id,
    display_name: user.email?.split('@')[0] ?? 'Learner',
    current_phase: 1,
    study_goal_hours_per_week: 10,
    ai_personality: 'mentor',
  })

  // 2. Seed all curriculum topics + labs
  const topicRows = CURRICULUM.flatMap(phase => [
    ...phase.topics.map(topic => ({
      user_id: user.id,
      phase: phase.phase,
      topic_key: topic.key,
      status: 'not_started',
      depth_level: 0,
    })),
    ...phase.labs.map(lab => ({
      user_id: user.id,
      phase: phase.phase,
      topic_key: lab.key,
      status: 'not_started',
      depth_level: 0,
    })),
  ])

  await supabase.from('topic_progress').insert(topicRows)

  // 3. Seed portfolio projects
  const projectRows = PORTFOLIO_PROJECTS.map(p => ({
    user_id: user.id,
    project_key: p.key,
    status: 'not_started',
    milestones: p.milestones.map(title => ({ title, completed: false })),
    resume_talking_points: p.resumeTalkingPoints,
    github_url: null,
    notes: null,
  }))

  await supabase.from('projects').insert(projectRows)

  // 4. Seed skill assessments (all at level 0)
  const skillRows = SKILL_CATEGORIES.map(skill => ({
    user_id: user.id,
    skill_key: skill.key,
    level: 0,
  }))

  await supabase.from('skill_assessments').insert(skillRows)

  return NextResponse.json({ message: 'Seeded successfully' })
}
