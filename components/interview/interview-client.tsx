'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, MessageSquare, CheckCircle2, Circle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export interface InterviewQuestion {
  id: string
  question: string
  category: string
  phase: number
  difficulty: 'junior' | 'mid' | 'senior'
  hint: string
  answered: boolean
}

interface InterviewClientProps {
  questions: InterviewQuestion[]
  answeredSet: Set<string>
}

const DIFFICULTY_STYLES = {
  junior: 'bg-green-500/10 text-green-600 border-green-500/30',
  mid: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  senior: 'bg-red-500/10 text-red-500 border-red-500/30',
}

export function InterviewClient({ questions, answeredSet }: InterviewClientProps) {
  const [localAnswered, setLocalAnswered] = useState<Set<string>>(new Set(answeredSet))
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterDifficulty, setFilterDifficulty] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const categories = Array.from(new Set(questions.map(q => q.category))).sort()

  const filtered = questions.filter(q => {
    if (filterCategory !== 'all' && q.category !== filterCategory) return false
    if (filterDifficulty !== 'all' && q.difficulty !== filterDifficulty) return false
    const done = localAnswered.has(q.id)
    if (filterStatus === 'done' && !done) return false
    if (filterStatus === 'todo' && done) return false
    return true
  })

  const totalAnswered = localAnswered.size
  const total = questions.length
  const readinessPct = total > 0 ? Math.round((totalAnswered / total) * 100) : 0

  async function toggleAnswered(id: string) {
    const next = new Set(localAnswered)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setLocalAnswered(next)
    await fetch('/api/interview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_id: id, answered: next.has(id) }),
    })
  }

  return (
    <div className="space-y-6">
      {/* Readiness score */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium">Interview Readiness</p>
            <p className="text-xs text-muted-foreground mt-0.5">{totalAnswered} of {total} questions practised</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-teal-500">{readinessPct}%</p>
          </div>
        </div>
        <div className="w-full bg-secondary rounded-full h-2">
          <div
            className="bg-teal-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${readinessPct}%` }}
          />
        </div>
        <div className="flex gap-3 mt-3 flex-wrap">
          <span className="text-xs text-green-600">{questions.filter(q => q.difficulty === 'junior').filter(q => localAnswered.has(q.id)).length}/{questions.filter(q => q.difficulty === 'junior').length} Junior</span>
          <span className="text-xs text-amber-600">{questions.filter(q => q.difficulty === 'mid').filter(q => localAnswered.has(q.id)).length}/{questions.filter(q => q.difficulty === 'mid').length} Mid</span>
          <span className="text-xs text-red-500">{questions.filter(q => q.difficulty === 'senior').filter(q => localAnswered.has(q.id)).length}/{questions.filter(q => q.difficulty === 'senior').length} Senior</span>
        </div>
      </div>

      {/* AI mock interview CTA */}
      <div className="bg-teal-600/5 border border-teal-600/20 rounded-lg p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Practice with AI Coach</p>
          <p className="text-xs text-muted-foreground mt-0.5">Start a mock interview session — the AI will ask questions and give feedback on your answers.</p>
        </div>
        <Link
          href="/chat?mode=interview"
          className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-teal-600 text-white text-xs font-medium hover:bg-teal-700 transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Start mock interview
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-xs text-muted-foreground mr-1">Category:</span>
          {(['all', ...categories]).map(c => (
            <button
              key={c}
              onClick={() => setFilterCategory(c)}
              className={cn(
                'px-2 py-0.5 rounded text-xs border transition-colors',
                filterCategory === c ? 'border-teal-600 bg-teal-600/15 text-teal-500' : 'border-border text-muted-foreground hover:border-teal-600/40'
              )}
            >
              {c === 'all' ? 'All' : c}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-1">Level:</span>
          {['all', 'junior', 'mid', 'senior'].map(d => (
            <button
              key={d}
              onClick={() => setFilterDifficulty(d)}
              className={cn(
                'px-2 py-0.5 rounded text-xs border transition-colors capitalize',
                filterDifficulty === d ? 'border-teal-600 bg-teal-600/15 text-teal-500' : 'border-border text-muted-foreground hover:border-teal-600/40'
              )}
            >
              {d === 'all' ? 'All' : d}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-1">Status:</span>
          {[['all', 'All'], ['todo', 'To do'], ['done', 'Done']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilterStatus(val)}
              className={cn(
                'px-2 py-0.5 rounded text-xs border transition-colors',
                filterStatus === val ? 'border-teal-600 bg-teal-600/15 text-teal-500' : 'border-border text-muted-foreground hover:border-teal-600/40'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Question list */}
      <div className="space-y-1.5">
        {filtered.map(q => {
          const done = localAnswered.has(q.id)
          const expanded = expandedId === q.id
          return (
            <div key={q.id} className={cn('border border-border rounded-lg overflow-hidden', done && 'opacity-75')}>
              <div className="flex items-start gap-3 p-3">
                <button
                  onClick={() => toggleAnswered(q.id)}
                  className="flex-shrink-0 mt-0.5 text-muted-foreground hover:text-teal-500 transition-colors"
                >
                  {done
                    ? <CheckCircle2 className="w-4 h-4 text-teal-500" />
                    : <Circle className="w-4 h-4" />
                  }
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <p className={cn('text-sm flex-1', done && 'line-through text-muted-foreground')}>{q.question}</p>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium', DIFFICULTY_STYLES[q.difficulty])}>
                      {q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1)}
                    </span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">{q.category}</Badge>
                  </div>
                </div>
                <button
                  onClick={() => setExpandedId(expanded ? null : q.id)}
                  className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5"
                >
                  {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              </div>

              {expanded && (
                <div className="px-10 pb-3 border-t border-border/50">
                  <div className="pt-2 space-y-2">
                    <div className="bg-teal-600/5 border border-teal-600/15 rounded-md p-3">
                      <p className="text-xs font-medium text-teal-500 mb-1">What to cover in your answer</p>
                      <p className="text-xs text-muted-foreground">{q.hint}</p>
                    </div>
                    <Link
                      href={`/chat?mode=interview&q=${encodeURIComponent(q.question)}`}
                      className="inline-flex items-center gap-1.5 text-xs text-teal-500 hover:underline"
                    >
                      <MessageSquare className="w-3 h-3" />
                      Practice this question with AI
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
