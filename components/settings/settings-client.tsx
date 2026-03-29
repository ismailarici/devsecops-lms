'use client'

import { useState, useTransition } from 'react'
import { LogOut, Save, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { Profile, AIPersonality } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface SettingsClientProps {
  profile: Profile
}

export function SettingsClient({ profile }: SettingsClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [displayName, setDisplayName] = useState(profile.display_name ?? '')
  const [studyGoal, setStudyGoal] = useState(profile.study_goal_hours_per_week)
  const [personality, setPersonality] = useState<AIPersonality>(profile.ai_personality)
  const [currentPhase, setCurrentPhase] = useState(profile.current_phase)

  async function handleSave() {
    setIsSaving(true)
    setSaved(false)
    const supabase = createClient()
    await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim() || null,
        study_goal_hours_per_week: studyGoal,
        ai_personality: personality,
        current_phase: currentPhase,
      })
      .eq('id', profile.id)
    setIsSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    router.refresh()
  }

  function handleSignOut() {
    startTransition(async () => {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/auth')
    })
  }

  return (
    <div className="max-w-lg space-y-8">

      {/* Profile */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Profile</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Display name</label>
            <Input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="max-w-xs"
            />
          </div>
        </div>
      </section>

      {/* Current phase */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Current Phase</h2>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6].map(p => (
            <button
              key={p}
              onClick={() => setCurrentPhase(p)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm border transition-colors',
                currentPhase === p
                  ? 'border-teal-600 bg-teal-600/15 text-teal-500 font-medium'
                  : 'border-border text-muted-foreground hover:border-teal-600/40'
              )}
            >
              Phase {p}
            </button>
          ))}
        </div>
      </section>

      {/* Study goal */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Weekly Study Goal</h2>
        <div className="flex flex-wrap gap-2">
          {[5, 10, 15, 20, 25, 30].map(h => (
            <button
              key={h}
              onClick={() => setStudyGoal(h)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm border transition-colors',
                studyGoal === h
                  ? 'border-teal-600 bg-teal-600/15 text-teal-500 font-medium'
                  : 'border-border text-muted-foreground hover:border-teal-600/40'
              )}
            >
              {h}h / week
            </button>
          ))}
        </div>
      </section>

      {/* AI personality */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">AI Coach Style</h2>
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          {([
            { value: 'mentor', label: 'Mentor', desc: 'Structured, thorough, explains the why' },
            { value: 'casual', label: 'Casual', desc: 'Conversational, direct, skips formality' },
          ] as const).map(opt => (
            <button
              key={opt.value}
              onClick={() => setPersonality(opt.value)}
              className={cn(
                'text-left p-3 rounded-lg border transition-colors',
                personality === opt.value
                  ? 'border-teal-600 bg-teal-600/10'
                  : 'border-border hover:border-teal-600/40'
              )}
            >
              <p className={cn('text-sm font-medium', personality === opt.value && 'text-teal-500')}>{opt.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-60 transition-colors"
        >
          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {isSaving ? 'Saving…' : saved ? 'Saved!' : 'Save changes'}
        </button>

        <button
          onClick={handleSignOut}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </div>
  )
}
