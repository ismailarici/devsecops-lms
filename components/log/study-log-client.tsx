'use client'

import { useState } from 'react'
import { Flame, Clock, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { StudySession } from '@/lib/types'
import { format } from 'date-fns'

const ENERGY_LABELS = ['', '🪫 Low', '😐 Okay', '🙂 Good', '⚡ High', '🔥 Peak']

interface StudyLogClientProps {
  initialSessions: StudySession[]
}

export function StudyLogClient({ initialSessions }: StudyLogClientProps) {
  const [sessions, setSessions] = useState<StudySession[]>(initialSessions)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [duration, setDuration] = useState('')
  const [topicInput, setTopicInput] = useState('')
  const [topics, setTopics] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [energy, setEnergy] = useState(3)

  const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0)
  const totalHours = Math.floor(totalMinutes / 60)
  const totalMins = totalMinutes % 60

  // Streak calculation
  const today = new Date()
  let streak = 0
  const sessionDates = new Set(sessions.map(s => s.date))
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    if (sessionDates.has(dateStr)) {
      streak++
    } else if (i > 0) {
      break
    }
  }

  // Weekly hours chart (last 7 days)
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (6 - i))
    const dateStr = d.toISOString().split('T')[0]
    const mins = sessions
      .filter(s => s.date === dateStr)
      .reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0)
    return { date: dateStr, label: format(d, 'EEE'), mins }
  })
  const maxMins = Math.max(...weekData.map(d => d.mins), 1)

  function addTopic(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && topicInput.trim()) {
      e.preventDefault()
      setTopics(prev => [...prev, topicInput.trim()])
      setTopicInput('')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!duration) return
    setSaving(true)

    const res = await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date,
        duration_minutes: parseInt(duration),
        topics,
        notes: notes || null,
        energy_level: energy,
      }),
    })
    const newSession = await res.json() as StudySession
    setSessions(prev => [newSession, ...prev])

    // Reset form
    setDuration('')
    setTopics([])
    setTopicInput('')
    setNotes('')
    setEnergy(3)
    setShowForm(false)
    setSaving(false)
  }

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Study Log</h1>
          <p className="text-sm text-muted-foreground">
            {totalHours}h {totalMins}m total · {sessions.length} sessions
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-teal-600 hover:bg-teal-700"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-1" /> Log Session
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
          <Flame className="w-5 h-5 text-orange-400" />
          <div>
            <p className="text-xl font-bold">{streak}</p>
            <p className="text-xs text-muted-foreground">Day streak</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-teal-400" />
          <div>
            <p className="text-xl font-bold">{totalHours}h</p>
            <p className="text-xs text-muted-foreground">Total study time</p>
          </div>
        </div>
      </div>

      {/* Weekly chart */}
      <div className="bg-card border border-border rounded-lg p-4">
        <p className="text-sm font-medium mb-3">Last 7 Days</p>
        <div className="flex items-end gap-2 h-20">
          {weekData.map(day => (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-teal-600/80 rounded-sm transition-all"
                style={{ height: `${Math.max(2, (day.mins / maxMins) * 64)}px` }}
              />
              <span className="text-[10px] text-muted-foreground">{day.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Log form */}
      {showForm && (
        <div className="bg-card border border-teal-600/30 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Log a session</p>
            <button onClick={() => setShowForm(false)}>
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Date</label>
                <Input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="h-9 text-sm mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Duration (minutes)</label>
                <Input
                  type="number"
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  placeholder="60"
                  min="1"
                  className="h-9 text-sm mt-1"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Topics covered (Enter to add)</label>
              <Input
                value={topicInput}
                onChange={e => setTopicInput(e.target.value)}
                onKeyDown={addTopic}
                placeholder="Python, Boto3, ..."
                className="h-9 text-sm mt-1"
              />
              {topics.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {topics.map((t, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setTopics(prev => prev.filter((_, j) => j !== i))}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-secondary rounded-full text-xs text-muted-foreground hover:text-destructive"
                    >
                      {t} ×
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Energy level</label>
              <div className="flex gap-2 mt-1">
                {[1, 2, 3, 4, 5].map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setEnergy(lvl)}
                    className={cn(
                      'flex-1 py-1.5 text-xs rounded-md border transition-colors',
                      energy === lvl
                        ? 'border-teal-600 bg-teal-600/15 text-teal-400'
                        : 'border-border text-muted-foreground hover:border-teal-600/30'
                    )}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{ENERGY_LABELS[energy]}</p>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Notes (optional)</label>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="What did you learn? Any blockers?"
                className="text-sm mt-1"
                rows={3}
              />
            </div>

            <Button
              type="submit"
              disabled={saving || !duration}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              {saving ? 'Saving...' : 'Log Session'}
            </Button>
          </form>
        </div>
      )}

      {/* Session history */}
      <div className="space-y-2">
        <p className="text-sm font-medium">History</p>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sessions logged yet.</p>
        ) : (
          sessions.map(session => (
            <div
              key={session.id}
              className="bg-card border border-border rounded-lg px-4 py-3 flex items-start gap-4"
            >
              <div className="flex-shrink-0 text-center">
                <p className="text-lg font-bold">{Math.floor((session.duration_minutes ?? 0) / 60)}h
                  {(session.duration_minutes ?? 0) % 60 > 0 && `${(session.duration_minutes ?? 0) % 60}m`}
                </p>
                <p className="text-xs text-muted-foreground">{format(new Date(session.date), 'MMM d')}</p>
              </div>
              <div className="flex-1 min-w-0">
                {session.topics?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1">
                    {session.topics.map((t, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                )}
                {session.notes && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{session.notes}</p>
                )}
              </div>
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {ENERGY_LABELS[session.energy_level ?? 3]}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
