'use client'

import type { ChatMode } from '@/lib/types'

const MODES: { value: ChatMode; label: string; emoji: string }[] = [
  { value: 'teaching', label: 'Teaching', emoji: '🎓' },
  { value: 'code_review', label: 'Code Review', emoji: '🔍' },
  { value: 'interview', label: 'Interview', emoji: '🎤' },
  { value: 'debug', label: 'Debug', emoji: '🐛' },
  { value: 'checkin', label: 'Check-in', emoji: '☕' },
]

interface ModeSelectorProps {
  value: ChatMode
  onChange: (mode: ChatMode) => void
}

export function ModeSelector({ value, onChange }: ModeSelectorProps) {
  return (
    <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
      {MODES.map(m => (
        <button
          key={m.value}
          onClick={() => onChange(m.value)}
          title={m.label}
          className={`px-2 py-1 rounded-md text-xs transition-colors whitespace-nowrap ${
            value === m.value
              ? 'bg-teal-600 text-white'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="hidden sm:inline">{m.emoji} {m.label}</span>
          <span className="sm:hidden">{m.emoji}</span>
        </button>
      ))}
    </div>
  )
}
