'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { DepthLevel } from '@/lib/types'

interface SkillWithLevel {
  key: string
  title: string
  phase: number
  level: number
}

interface SkillsClientProps {
  initialSkills: SkillWithLevel[]
  depthLabels: Record<number, string>
}

const DEPTH_COLORS: Record<number, string> = {
  0: 'secondary',
  1: 'outline',
  2: 'info',
  3: 'warning',
  4: 'teal',
}

const DEPTH_BAR_COLORS: Record<number, string> = {
  0: 'bg-border',
  1: 'bg-blue-500/60',
  2: 'bg-blue-500',
  3: 'bg-yellow-500',
  4: 'bg-teal-500',
}

export function SkillsClient({ initialSkills, depthLabels }: SkillsClientProps) {
  const [skills, setSkills] = useState(initialSkills)
  const [saving, setSaving] = useState<string | null>(null)

  async function updateSkill(key: string, level: number) {
    setSaving(key)
    setSkills(prev => prev.map(s => s.key === key ? { ...s, level } : s))

    await fetch('/api/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skill_key: key, level }),
    })
    setSaving(null)
  }

  const avgLevel = skills.reduce((sum, s) => sum + s.level, 0) / skills.length
  const interviewReady = skills.filter(s => s.level >= 4).length
  const working = skills.filter(s => s.level >= 2).length

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Skills Map</h1>
        <p className="text-sm text-muted-foreground">
          Self-assessed across {skills.length} skill areas
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Avg Level', value: avgLevel.toFixed(1) },
          { label: 'Working+', value: working },
          { label: 'Interview-Ready', value: interviewReady },
        ].map(({ label, value }) => (
          <div key={label} className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Skill list */}
      <div className="space-y-2">
        {skills.map(skill => (
          <div
            key={skill.key}
            className="bg-card border border-border rounded-lg p-4 space-y-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{skill.title}</p>
                <p className="text-xs text-muted-foreground">Phase {skill.phase}</p>
              </div>
              <div className="flex items-center gap-2">
                {saving === skill.key && (
                  <div className="w-3 h-3 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
                )}
                <Badge
                  variant={DEPTH_COLORS[skill.level] as Parameters<typeof Badge>[0]['variant']}
                  className="text-xs whitespace-nowrap"
                >
                  {depthLabels[skill.level]}
                </Badge>
              </div>
            </div>

            {/* Level selector */}
            <div className="flex gap-1.5">
              {[0, 1, 2, 3, 4].map(lvl => (
                <button
                  key={lvl}
                  onClick={() => updateSkill(skill.key, lvl)}
                  title={depthLabels[lvl]}
                  className={cn(
                    'flex-1 h-2 rounded-full transition-colors',
                    lvl <= skill.level ? DEPTH_BAR_COLORS[skill.level] : 'bg-border'
                  )}
                />
              ))}
            </div>

            <div className="flex gap-1 flex-wrap">
              {[0, 1, 2, 3, 4].map(lvl => (
                <button
                  key={lvl}
                  onClick={() => updateSkill(skill.key, lvl)}
                  className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded border transition-colors',
                    skill.level === lvl
                      ? 'border-teal-600 text-teal-400 bg-teal-600/10'
                      : 'border-border text-muted-foreground hover:border-teal-600/30'
                  )}
                >
                  {depthLabels[lvl]}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
