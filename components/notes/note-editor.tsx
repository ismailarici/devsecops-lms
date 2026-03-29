'use client'

import { useState, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Pin, PinOff, Trash2, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Note, NoteType } from '@/lib/types'

const NOTE_TYPES: NoteType[] = ['concept', 'code', 'lab', 'interview', 'resource']

interface NoteEditorProps {
  note: Note | null
  onSave: (data: {
    title: string
    content: string
    note_type: NoteType
    tags: string[]
    topic_key: string | null
    phase: number | null
  }) => Promise<void>
  onPin?: () => void
  onDelete?: () => void
}

export function NoteEditor({ note, onSave, onPin, onDelete }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title ?? '')
  const [noteType, setNoteType] = useState<NoteType>((note?.note_type as NoteType) ?? 'concept')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>(note?.tags ?? [])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Write your notes here...' }),
    ],
    content: note?.content ?? '',
    editorProps: {
      attributes: { class: 'tiptap p-4 min-h-[300px] outline-none' },
    },
  })

  const handleSave = useCallback(async () => {
    if (!editor) return
    setSaving(true)
    await onSave({
      title: title || 'Untitled',
      content: editor.getHTML(),
      note_type: noteType,
      tags,
      topic_key: note?.topic_key ?? null,
      phase: note?.phase ?? null,
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [editor, title, noteType, tags, note, onSave])

  function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      const newTag = tagInput.trim().toLowerCase()
      if (!tags.includes(newTag)) setTags(prev => [...prev, newTag])
      setTagInput('')
    }
  }

  function removeTag(tag: string) {
    setTags(prev => prev.filter(t => t !== tag))
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border flex-wrap">
        <div className="flex gap-1 flex-wrap flex-1">
          {NOTE_TYPES.map(t => (
            <button
              key={t}
              onClick={() => setNoteType(t)}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs border transition-colors capitalize',
                noteType === t
                  ? 'border-teal-600 bg-teal-600/15 text-teal-400'
                  : 'border-border text-muted-foreground hover:border-teal-600/50'
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {onPin && (
            <Button variant="ghost" size="icon" onClick={onPin} className="h-8 w-8">
              {note?.pinned ? (
                <PinOff className="w-3.5 h-3.5 text-teal-400" />
              ) : (
                <Pin className="w-3.5 h-3.5" />
              )}
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 hover:text-destructive">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={saving}
            size="sm"
            className="bg-teal-600 hover:bg-teal-700 h-8"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : saved ? (
              'Saved!'
            ) : (
              <>
                <Save className="w-3.5 h-3.5 mr-1" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Note title..."
        className="px-4 py-3 text-lg font-semibold bg-transparent border-b border-border outline-none placeholder:text-muted-foreground"
        onKeyDown={e => { if (e.key === 'Enter') editor?.commands.focus() }}
      />

      {/* Tags */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border flex-wrap">
        {tags.map(tag => (
          <button
            key={tag}
            onClick={() => removeTag(tag)}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-secondary rounded-full text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            {tag} ×
          </button>
        ))}
        <input
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          onKeyDown={addTag}
          placeholder="Add tag (Enter)..."
          className="text-xs bg-transparent outline-none placeholder:text-muted-foreground min-w-[120px]"
        />
      </div>

      {/* Tiptap editor area */}
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
