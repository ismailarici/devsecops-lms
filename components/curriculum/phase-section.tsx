'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, FlaskConical } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { TopicRow } from './topic-row'
import type { CurriculumPhase, TopicProgress } from '@/lib/types'

interface PhaseSectionProps {
  phase: CurriculumPhase
  progressMap: Map<string, TopicProgress>
}

export function CurriculumPhaseSection({ phase, progressMap }: PhaseSectionProps) {
  const [open, setOpen] = useState(phase.phase === 1)

  const allKeys = [
    ...phase.topics.map(t => t.key),
    ...phase.labs.map(l => l.key),
  ]
  const total = allKeys.length
  const completed = allKeys.filter(
    k => progressMap.get(k)?.status === 'complete'
  ).length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-secondary/50 transition-colors"
      >
        {open ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">
              Phase {phase.phase}: {phase.title}
            </span>
            <Badge variant="outline" className="text-xs hidden sm:inline-flex">
              {phase.weeks}
            </Badge>
            {pct === 100 && <Badge variant="teal" className="text-xs">Complete</Badge>}
          </div>
          <div className="flex items-center gap-3">
            <Progress value={pct} className="flex-1 h-1.5 max-w-[200px]" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {completed}/{total} · {pct}%
            </span>
          </div>
        </div>
      </button>

      {open && (
        <div className="border-t border-border">
          {/* Topics */}
          <div className="divide-y divide-border">
            {phase.topics.map(topic => (
              <TopicRow
                key={topic.key}
                topicKey={topic.key}
                title={topic.title}
                description={topic.description}
                tools={topic.tools}
                whyItMatters={topic.whyItMatters}
                resources={topic.resources}
                isLab={false}
                progress={progressMap.get(topic.key)}
              />
            ))}
          </div>

          {/* Labs */}
          {phase.labs.length > 0 && (
            <div className="border-t border-border bg-secondary/20">
              <div className="px-4 py-2 flex items-center gap-2">
                <FlaskConical className="w-3 h-3 text-teal-400" />
                <span className="text-xs font-medium text-teal-400 uppercase tracking-wide">
                  Labs
                </span>
              </div>
              <div className="divide-y divide-border">
                {phase.labs.map(lab => (
                  <TopicRow
                    key={lab.key}
                    topicKey={lab.key}
                    title={lab.title}
                    description={lab.description}
                    tools={[]}
                    whyItMatters=""
                    resources={lab.resources}
                    isLab={true}
                    progress={progressMap.get(lab.key)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
