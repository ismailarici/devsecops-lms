import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ChatInterface } from '@/components/chat/chat-interface'
import { CURRICULUM, PHASE_NAMES } from '@/lib/curriculum-data'
import type { ChatMode } from '@/lib/types'

interface Starter {
  label: string
  message: string
  mode: ChatMode
}

interface Props {
  searchParams: { topic?: string; mode?: string }
}

export default async function ChatPage({ searchParams }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('current_phase')
    .eq('id', user.id)
    .single()

  const currentPhase = profile?.current_phase ?? 1
  const phaseName = PHASE_NAMES[currentPhase]

  // Suggested starters based on current phase
  const phaseData = CURRICULUM.find(p => p.phase === currentPhase)
  const starters: Starter[] = phaseData?.topics.slice(0, 3).map(t => ({
    label: `Explain ${t.title}`,
    message: `Explain ${t.title} to me. I want to understand it at the working level, not just theory. Give me a practical example.`,
    mode: 'teaching' as ChatMode,
  })) ?? []

  const checkinStarter: Starter = {
    label: 'Where should I focus right now?',
    message: `I want a quick check-in. Based on where I am in the curriculum, what should I be working on right now? What's my critical path?`,
    mode: 'checkin',
  }
  starters.push(checkinStarter)

  return (
    <ChatInterface
      initialMode={(searchParams.mode as 'teaching' | 'code_review' | 'interview' | 'debug' | 'checkin') ?? 'teaching'}
      initialTopicKey={searchParams.topic ?? null}
      phaseName={phaseName}
      starters={starters}
    />
  )
}
