import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic } from '@/lib/anthropic/client'
import { buildSystemPrompt, buildContextFromData } from '@/lib/anthropic/system-prompt'
import { getTotalTopicsCount } from '@/lib/curriculum-data'
import type { ChatMode } from '@/lib/types'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as {
    message: string
    conversation_id: string | null
    mode: ChatMode
    topic_key?: string
  }

  const { message, conversation_id, mode, topic_key } = body

  // Fetch context data in parallel
  const [profileRes, progressRes, notesRes, projectsRes, sessionsRes] = await Promise.all([
    supabase.from('profiles').select('current_phase').eq('id', user.id).single(),
    supabase.from('topic_progress').select('*').eq('user_id', user.id),
    supabase.from('notes').select('title, content, note_type').eq('user_id', user.id)
      .order('updated_at', { ascending: false }).limit(10),
    supabase.from('projects').select('project_key, status').eq('user_id', user.id),
    supabase.from('study_sessions').select('duration_minutes').eq('user_id', user.id),
  ])

  const currentPhase = profileRes.data?.current_phase ?? 1
  const progress = progressRes.data ?? []
  const notes = notesRes.data ?? []
  const projects = projectsRes.data ?? []
  const totalHours = Math.round(
    (sessionsRes.data ?? []).reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0) / 60
  )

  const ctx = buildContextFromData(
    progress,
    notes as Parameters<typeof buildContextFromData>[1],
    projects as Parameters<typeof buildContextFromData>[2],
    totalHours,
    currentPhase,
    getTotalTopicsCount(),
    mode
  )
  const systemPrompt = buildSystemPrompt(ctx)

  // Get or create conversation
  let convId = conversation_id
  if (!convId) {
    const { data: conv } = await supabase
      .from('chat_conversations')
      .insert({
        user_id: user.id,
        title: message.slice(0, 60),
        mode,
        topic_key: topic_key ?? null,
      })
      .select('id')
      .single()
    convId = conv?.id ?? null
  }

  // Fetch last 40 messages for context window
  const { data: history } = convId
    ? await supabase
        .from('chat_messages')
        .select('role, content')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })
        .limit(40)
    : { data: [] }

  // Save user message
  if (convId) {
    await supabase.from('chat_messages').insert({
      user_id: user.id,
      conversation_id: convId,
      role: 'user',
      content: message,
      mode,
      topic_key: topic_key ?? null,
    })
  }

  // Build message history for Claude
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    ...(history ?? []).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: message },
  ]

  // Stream response
  const stream = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    messages,
    stream: true,
  })

  let fullContent = ''

  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            const text = chunk.delta.text
            fullContent += text
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
          }
        }
        // Save assistant response after streaming completes
        if (convId && fullContent) {
          await supabase.from('chat_messages').insert({
            user_id: user.id,
            conversation_id: convId,
            role: 'assistant',
            content: fullContent,
            mode,
            topic_key: topic_key ?? null,
          })
          // Update conversation message count + timestamp
          await supabase
            .from('chat_conversations')
            .update({
              message_count: (history?.length ?? 0) + 2,
              updated_at: new Date().toISOString(),
            })
            .eq('id', convId)
        }
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true, conversation_id: convId })}\n\n`)
        )
        controller.close()
      } catch (_err) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`)
        )
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
