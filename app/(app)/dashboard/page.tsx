import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CURRICULUM, PHASE_NAMES, getTotalTopicsCount, PORTFOLIO_PROJECTS, SKILL_CATEGORIES } from '@/lib/curriculum-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Clock,
  BookOpen,
  FlaskConical,
  FolderKanban,
  Flame,
  ChevronRight,
} from 'lucide-react'
import Link from 'next/link'

async function seedUserIfNeeded(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data: existing } = await supabase
    .from('topic_progress')
    .select('id')
    .eq('user_id', userId)
    .limit(1)

  if (existing && existing.length > 0) return

  // Create profile
  await supabase.from('profiles').upsert({
    id: userId,
    display_name: null,
    current_phase: 1,
    study_goal_hours_per_week: 10,
    ai_personality: 'mentor',
  })

  // Seed topics + labs
  const topicRows = CURRICULUM.flatMap(phase => [
    ...phase.topics.map(topic => ({
      user_id: userId,
      phase: phase.phase,
      topic_key: topic.key,
      status: 'not_started',
      depth_level: 0,
    })),
    ...phase.labs.map(lab => ({
      user_id: userId,
      phase: phase.phase,
      topic_key: lab.key,
      status: 'not_started',
      depth_level: 0,
    })),
  ])
  await supabase.from('topic_progress').insert(topicRows)

  // Seed projects
  const projectRows = PORTFOLIO_PROJECTS.map(p => ({
    user_id: userId,
    project_key: p.key,
    status: 'not_started',
    milestones: p.milestones.map((title: string) => ({ title, completed: false })),
    resume_talking_points: p.resumeTalkingPoints,
    github_url: null,
    notes: null,
  }))
  await supabase.from('projects').insert(projectRows)

  // Seed skill assessments
  const skillRows = SKILL_CATEGORIES.map(skill => ({
    user_id: userId,
    skill_key: skill.key,
    level: 0,
  }))
  await supabase.from('skill_assessments').insert(skillRows)
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  // Auto-seed on first visit
  await seedUserIfNeeded(supabase, user.id)

  // Fetch all data in parallel
  const [profileRes, progressRes, sessionsRes, projectsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('topic_progress').select('*').eq('user_id', user.id),
    supabase.from('study_sessions').select('duration_minutes, date, created_at').eq('user_id', user.id),
    supabase.from('projects').select('project_key, status').eq('user_id', user.id),
  ])

  const profile = profileRes.data
  const progress = progressRes.data ?? []
  const sessions = sessionsRes.data ?? []
  const projects = projectsRes.data ?? []

  const currentPhase = profile?.current_phase ?? 1
  const totalTopics = getTotalTopicsCount()
  const completedTopics = progress.filter(p => p.status === 'complete').length
  const completedLabs = progress.filter(
    p => p.status === 'complete' && p.topic_key.startsWith('lab')
  ).length
  const inProgressProjects = projects.filter(
    p => p.status === 'in_progress' || p.status === 'planning'
  ).length

  const totalHours = Math.round(
    sessions.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0) / 60
  )

  // Phase progress per phase
  const phaseProgress = CURRICULUM.map(phase => {
    const phaseTopicKeys = [
      ...phase.topics.map(t => t.key),
      ...phase.labs.map(l => l.key),
    ]
    const phaseTotal = phaseTopicKeys.length
    const phaseCompleted = progress.filter(
      p => phaseTopicKeys.includes(p.topic_key) && p.status === 'complete'
    ).length
    return {
      phase: phase.phase,
      title: phase.title,
      weeks: phase.weeks,
      total: phaseTotal,
      completed: phaseCompleted,
      pct: phaseTotal > 0 ? Math.round((phaseCompleted / phaseTotal) * 100) : 0,
    }
  })

  // Streak calculation
  const today = new Date()
  let streak = 0
  const sessionDates = new Set(sessions.map(s => s.date))
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    if (sessionDates.has(dateStr)) {
      streak++
    } else if (i > 0) {
      break
    }
  }

  // Today's focus — next uncompleted topics in current phase
  const currentPhaseData = CURRICULUM.find(p => p.phase === currentPhase)
  const completedKeys = new Set(progress.filter(p => p.status === 'complete').map(p => p.topic_key))
  const nextTopics = currentPhaseData?.topics
    .filter(t => !completedKeys.has(t.key))
    .slice(0, 3) ?? []

  // AI nudge — simple rule-based for now
  const lastSession = sessions.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0]
  const daysSinceLastSession = lastSession
    ? Math.floor((Date.now() - new Date(lastSession.created_at).getTime()) / 86400000)
    : 999
  const nudge =
    daysSinceLastSession === 0
      ? "You studied today — good. Don't stop now, log what you actually learned."
      : daysSinceLastSession === 1
      ? "Yesterday was your last session. Keep the streak going — even 30 minutes counts."
      : daysSinceLastSession < 7
      ? `It's been ${daysSinceLastSession} days since your last session. You're still on track but don't let the gap widen.`
      : "Over a week since your last session. You're burning runway. Get back in today."

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {PHASE_NAMES[currentPhase]} — Phase {currentPhase} of 6
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Study Hours', value: totalHours, icon: Clock },
          { label: 'Topics Done', value: `${completedTopics}/${totalTopics}`, icon: BookOpen },
          { label: 'Labs Done', value: completedLabs, icon: FlaskConical },
          { label: 'Day Streak', value: streak, icon: Flame },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-teal-600/15 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-teal-400" />
              </div>
              <div>
                <p className="text-xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Current phase card */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Current Phase</CardTitle>
              <Badge variant="teal">Phase {currentPhase}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium">{PHASE_NAMES[currentPhase]}</span>
                <span className="text-muted-foreground">
                  {phaseProgress.find(p => p.phase === currentPhase)?.pct ?? 0}%
                </span>
              </div>
              <Progress value={phaseProgress.find(p => p.phase === currentPhase)?.pct ?? 0} />
            </div>
            <p className="text-xs text-muted-foreground">
              {currentPhaseData?.weeks} · {currentPhaseData?.goal}
            </p>
          </CardContent>
        </Card>

        {/* AI Nudge */}
        <Card className="border-teal-600/30 bg-teal-600/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-teal-400">AI Coach</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed">{nudge}</p>
            <Link
              href="/chat"
              className="inline-flex items-center gap-1 text-xs text-teal-400 hover:underline"
            >
              Open AI Coach <ChevronRight className="w-3 h-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Today's Focus */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Today&apos;s Focus</CardTitle>
          </CardHeader>
          <CardContent>
            {nextTopics.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Phase {currentPhase} complete. Move to Phase {currentPhase + 1}.
              </p>
            ) : (
              <ul className="space-y-2">
                {nextTopics.map(topic => (
                  <li key={topic.key} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{topic.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{topic.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/curriculum"
              className="inline-flex items-center gap-1 text-xs text-teal-400 hover:underline mt-3"
            >
              View curriculum <ChevronRight className="w-3 h-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Projects */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {inProgressProjects} project{inProgressProjects !== 1 ? 's' : ''} in progress
            </p>
            <Link
              href="/projects"
              className="inline-flex items-center gap-1 text-xs text-teal-400 hover:underline mt-3"
            >
              <FolderKanban className="w-3 h-3" />
              View projects <ChevronRight className="w-3 h-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Phase overview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">All Phases</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {phaseProgress.map(p => (
              <div key={p.phase}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={p.phase === currentPhase ? 'text-teal-400 font-medium' : 'text-muted-foreground'}>
                    P{p.phase}: {p.title.split(' ').slice(0, 2).join(' ')}
                  </span>
                  <span className="text-muted-foreground">{p.pct}%</span>
                </div>
                <Progress value={p.pct} className="h-1" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
