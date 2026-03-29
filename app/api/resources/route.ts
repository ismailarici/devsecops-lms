import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { resource_key, status } = await request.json()

  const { error } = await supabase
    .from('resource_progress')
    .upsert(
      { user_id: user.id, resource_key, status, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,resource_key' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
