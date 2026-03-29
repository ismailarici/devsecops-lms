import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/resources?action=status  — update curriculum resource status
// POST /api/resources?action=add     — add custom resource
// DELETE /api/resources?id=...       — delete custom resource
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const action = request.nextUrl.searchParams.get('action') ?? 'status'

  if (action === 'status') {
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

  if (action === 'add') {
    const body = await request.json()
    const { data, error } = await supabase
      .from('resources')
      .insert({
        user_id: user.id,
        title: body.title,
        url: body.url,
        category: body.category ?? 'General',
        priority: body.priority ?? 'recommended',
        is_free: body.is_free ?? true,
        status: 'not_started',
        notes: body.notes ?? null,
        topic_key: null,
        is_custom: true,
      })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

export async function DELETE(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase
    .from('resources')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
