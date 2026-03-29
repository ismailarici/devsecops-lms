import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { INTERVIEW_QUESTIONS } from '@/lib/interview-data'
import { InterviewClient } from '@/components/interview/interview-client'

export default async function InterviewPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: progress } = await supabase
    .from('interview_progress')
    .select('question_id')
    .eq('user_id', user.id)

  const answeredSet = new Set((progress ?? []).map(p => p.question_id))

  const questions = INTERVIEW_QUESTIONS.map(q => ({
    ...q,
    answered: answeredSet.has(q.id),
  }))

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-semibold mb-1">Interview Prep</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {INTERVIEW_QUESTIONS.length} questions across {new Set(INTERVIEW_QUESTIONS.map(q => q.category)).size} categories. Mark questions as done as you practise them.
      </p>
      <InterviewClient questions={questions} answeredSet={answeredSet} />
    </div>
  )
}
