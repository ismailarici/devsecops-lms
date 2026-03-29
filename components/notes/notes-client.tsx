'use client'

import { useState, useCallback } from 'react'
import { Plus, Search, Pin, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { NoteEditor } from './note-editor'
import { cn } from '@/lib/utils'
import type { Note, NoteType } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'

const NOTE_TYPE_LABELS: Record<NoteType, string> = {
  concept: 'Concept',
  code: 'Code',
  lab: 'Lab',
  interview: 'Interview',
  resource: 'Resource',
}

const NOTE_TYPE_VARIANTS: Record<NoteType, Parameters<typeof Badge>[0]['variant']> = {
  concept: 'secondary',
  code: 'teal',
  lab: 'info',
  interview: 'warning',
  resource: 'outline',
}

interface NotesClientProps {
  initialNotes: Note[]
}

export function NotesClient({ initialNotes }: NotesClientProps) {
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [search, setSearch] = useState('')
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [filterType, setFilterType] = useState<NoteType | 'all'>('all')

  const filtered = notes.filter(n => {
    const matchesSearch =
      !search ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
    const matchesType = filterType === 'all' || n.note_type === filterType
    return matchesSearch && matchesType
  })

  const handleSave = useCallback(async (data: {
    title: string
    content: string
    note_type: NoteType
    tags: string[]
    topic_key: string | null
    phase: number | null
  }) => {
    if (isCreating) {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const newNote = await res.json() as Note
      setNotes(prev => [newNote, ...prev])
      setSelectedNote(newNote)
      setIsCreating(false)
    } else if (selectedNote) {
      await fetch('/api/notes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedNote.id, ...data }),
      })
      setNotes(prev =>
        prev.map(n =>
          n.id === selectedNote.id
            ? { ...n, ...data, updated_at: new Date().toISOString() }
            : n
        )
      )
      setSelectedNote(prev => prev ? { ...prev, ...data } : null)
    }
  }, [isCreating, selectedNote])

  const handlePin = useCallback(async (note: Note) => {
    const pinned = !note.pinned
    await fetch('/api/notes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: note.id, pinned }),
    })
    setNotes(prev => prev.map(n => n.id === note.id ? { ...n, pinned } : n))
    if (selectedNote?.id === note.id) setSelectedNote(prev => prev ? { ...prev, pinned } : null)
  }, [selectedNote])

  const handleDelete = useCallback(async (note: Note) => {
    if (!confirm(`Delete "${note.title}"?`)) return
    await fetch(`/api/notes?id=${note.id}`, { method: 'DELETE' })
    setNotes(prev => prev.filter(n => n.id !== note.id))
    if (selectedNote?.id === note.id) setSelectedNote(null)
  }, [selectedNote])

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className={cn(
        'flex flex-col border-r border-border w-full lg:w-72 flex-shrink-0',
        (selectedNote || isCreating) && 'hidden lg:flex'
      )}>
        {/* Search + new */}
        <div className="p-3 space-y-2 border-b border-border">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search notes..."
                className="pl-8 h-9 text-sm"
              />
            </div>
            <Button
              onClick={() => { setSelectedNote(null); setIsCreating(true) }}
              size="icon"
              className="h-9 w-9 bg-teal-600 hover:bg-teal-700 flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {/* Type filter */}
          <div className="flex gap-1 flex-wrap">
            {(['all', 'concept', 'code', 'lab', 'interview', 'resource'] as const).map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={cn(
                  'px-2 py-0.5 rounded text-xs border transition-colors capitalize',
                  filterType === t
                    ? 'border-teal-600 bg-teal-600/15 text-teal-400'
                    : 'border-border text-muted-foreground hover:border-teal-600/30'
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {notes.length === 0 ? 'No notes yet. Create your first one.' : 'No matches.'}
            </div>
          ) : (
            filtered.map(note => (
              <button
                key={note.id}
                onClick={() => { setSelectedNote(note); setIsCreating(false) }}
                className={cn(
                  'w-full text-left px-3 py-3 border-b border-border hover:bg-secondary/50 transition-colors',
                  selectedNote?.id === note.id && 'bg-secondary'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {note.pinned && <Pin className="w-3 h-3 text-teal-400 flex-shrink-0" />}
                      <span className="text-sm font-medium truncate">{note.title || 'Untitled'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={NOTE_TYPE_VARIANTS[note.note_type as NoteType]} className="text-[10px] px-1.5 py-0">
                        {NOTE_TYPE_LABELS[note.note_type as NoteType]}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Editor */}
      <div className={cn(
        'flex-1 flex flex-col',
        !selectedNote && !isCreating && 'hidden lg:flex'
      )}>
        {selectedNote || isCreating ? (
          <>
            {/* Mobile back button */}
            <div className="lg:hidden flex items-center gap-2 px-3 py-2 border-b border-border">
              <button
                onClick={() => { setSelectedNote(null); setIsCreating(false) }}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <X className="w-4 h-4" /> Back to notes
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NoteEditor
                key={selectedNote?.id ?? 'new'}
                note={selectedNote}
                onSave={handleSave}
                onPin={selectedNote ? () => handlePin(selectedNote) : undefined}
                onDelete={selectedNote ? () => handleDelete(selectedNote) : undefined}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Select a note or create a new one
          </div>
        )}
      </div>
    </div>
  )
}
