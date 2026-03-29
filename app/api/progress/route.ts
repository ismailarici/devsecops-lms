import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as {
    topic_key: string
    status?: string
    depth_level?: number
  }

  const { topic_key, ...updates } = body
  if (!topic_key) return NextResponse.json({ error: 'topic_key required' }, { status: 400 })

  const { error } = await supabase
    .from('topic_progress')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('topic_key', topic_key)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
