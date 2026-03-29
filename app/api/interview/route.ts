import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { question_id, answered } = await request.json()

  if (answered) {
    const { error } = await supabase
      .from('interview_progress')
      .upsert(
        { user_id: user.id, question_id, answered_at: new Date().toISOString() },
        { onConflict: 'user_id,question_id' }
      )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    await supabase
      .from('interview_progress')
      .delete()
      .eq('user_id', user.id)
      .eq('question_id', question_id)
  }

  return NextResponse.json({ ok: true })
}
