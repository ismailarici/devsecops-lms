'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ChatMessage } from './chat-message'
import { ModeSelector } from './mode-selector'
import type { ChatMode } from '@/lib/types'

interface Message {
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

interface Starter {
  label: string
  message: string
  mode: ChatMode
}

interface ChatInterfaceProps {
  initialMode: ChatMode
  initialTopicKey: string | null
  phaseName: string
  starters: Starter[]
}

export function ChatInterface({
  initialMode,
  initialTopicKey,
  phaseName,
  starters,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<ChatMode>(initialMode)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async (text: string, overrideMode?: ChatMode) => {
    const messageText = text.trim()
    if (!messageText || streaming) return

    const activeMode = overrideMode ?? mode

    setMessages(prev => [...prev, { role: 'user', content: messageText }])
    setInput('')
    setStreaming(true)

    // Add placeholder for streaming response
    setMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true }])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          conversation_id: conversationId,
          mode: activeMode,
          topic_key: initialTopicKey,
        }),
      })

      if (!response.ok || !response.body) {
        throw new Error('Failed to send message')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6)) as {
              text?: string
              done?: boolean
              conversation_id?: string
              error?: string
            }

            if (data.text) {
              setMessages(prev => {
                const updated = [...prev]
                const last = updated[updated.length - 1]
                if (last?.role === 'assistant') {
                  updated[updated.length - 1] = {
                    ...last,
                    content: last.content + data.text,
                    streaming: true,
                  }
                }
                return updated
              })
            }

            if (data.done) {
              if (data.conversation_id) setConversationId(data.conversation_id)
              setMessages(prev => {
                const updated = [...prev]
                const last = updated[updated.length - 1]
                if (last?.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, streaming: false }
                }
                return updated
              })
            }
          } catch {
            // malformed chunk, skip
          }
        }
      }
    } catch {
      setMessages(prev => {
        const updated = [...prev]
        const last = updated[updated.length - 1]
        if (last?.role === 'assistant') {
          updated[updated.length - 1] = {
            role: 'assistant',
            content: 'Something went wrong. Check your connection and try again.',
            streaming: false,
          }
        }
        return updated
      })
    } finally {
      setStreaming(false)
    }
  }, [streaming, mode, conversationId, initialTopicKey])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <div>
          <h1 className="text-sm font-semibold">AI Coach</h1>
          <p className="text-xs text-muted-foreground">{phaseName}</p>
        </div>
        <ModeSelector value={mode} onChange={setMode} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-4 pt-4">
            <div className="text-center space-y-1">
              <p className="text-sm font-medium">Your AI Coach is ready.</p>
              <p className="text-xs text-muted-foreground">
                Ask anything or pick a starter below.
              </p>
            </div>
            <div className="grid gap-2 max-w-lg mx-auto">
              {starters.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setMode(s.mode); sendMessage(s.message, s.mode) }}
                  className="text-left p-3 rounded-lg border border-border hover:border-teal-600/50 hover:bg-secondary/50 transition-colors text-sm"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <ChatMessage key={i} role={msg.role} content={msg.content} streaming={msg.streaming} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 flex-shrink-0 bg-background">
        <div className="flex gap-2 items-end max-w-4xl mx-auto">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything... (Enter to send, Shift+Enter for new line)"
            className="min-h-[44px] max-h-[200px] resize-none text-sm"
            rows={1}
            disabled={streaming}
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={streaming || !input.trim()}
            size="icon"
            className="bg-teal-600 hover:bg-teal-700 flex-shrink-0 h-11 w-11"
          >
            {streaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-1.5">
          Shift+Enter for new line · conversation history is saved automatically
        </p>
      </div>
    </div>
  )
}
