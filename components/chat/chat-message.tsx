'use client'

import { cn } from '@/lib/utils'

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

export function ChatMessage({ role, content, streaming }: ChatMessageProps) {
  const isUser = role === 'user'

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-lg px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-teal-600/20 text-foreground'
            : 'bg-secondary text-foreground'
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <div className="prose-sm prose-invert">
            <FormattedMessage content={content} />
            {streaming && (
              <span className="inline-block w-1.5 h-4 bg-teal-400 animate-pulse ml-0.5 align-middle" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Simple markdown-like formatter for assistant messages
function FormattedMessage({ content }: { content: string }) {
  if (!content) return null

  // Split into lines and process
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Code block
    if (line.startsWith('```')) {
      line.slice(3).trim() // lang hint (unused)
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      elements.push(
        <pre key={i} className="rounded-md p-3 my-2 overflow-x-auto text-xs font-mono" style={{ background: '#2d2a24', color: '#f0ebe2' }}>
          <code>{codeLines.join('\n')}</code>
        </pre>
      )
      i++
      continue
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="font-semibold text-sm mt-3 mb-1">{formatInline(line.slice(4))}</h3>)
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="font-semibold text-base mt-4 mb-1">{formatInline(line.slice(3))}</h2>)
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className="font-bold text-lg mt-4 mb-2">{formatInline(line.slice(2))}</h1>)
    }
    // List items
    else if (line.match(/^[-*] /)) {
      elements.push(
        <li key={i} className="ml-4 list-disc text-sm leading-relaxed">
          {formatInline(line.slice(2))}
        </li>
      )
    }
    // Numbered list
    else if (line.match(/^\d+\. /)) {
      elements.push(
        <li key={i} className="ml-4 list-decimal text-sm leading-relaxed">
          {formatInline(line.replace(/^\d+\. /, ''))}
        </li>
      )
    }
    // Empty line
    else if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />)
    }
    // Normal paragraph
    else {
      elements.push(<p key={i} className="text-sm leading-relaxed">{formatInline(line)}</p>)
    }

    i++
  }

  return <>{elements}</>
}

function formatInline(text: string): React.ReactNode {
  // Bold (**text**), inline code (`text`)
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={i} className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: '#e8e0d0', color: '#2d2a24' }}>
              {part.slice(1, -1)}
            </code>
          )
        }
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
        }
        return part
      })}
    </>
  )
}
