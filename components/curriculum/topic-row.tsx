'use client'

import { useState, useTransition } from 'react'
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { TopicProgress, TopicStatus, DepthLevel, CurriculumResource } from '@/lib/types'
import Link from 'next/link'

const STATUS_OPTIONS: { value: TopicStatus; label: string }[] = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'complete', label: 'Complete' },
  { value: 'needs_review', label: 'Needs Review' },
]

const DEPTH_OPTIONS: { value: DepthLevel; label: string }[] = [
  { value: 0, label: 'None' },
  { value: 1, label: 'Basic' },
  { value: 2, label: 'Working' },
  { value: 3, label: 'Strong' },
  { value: 4, label: 'Interview-Ready' },
]

const STATUS_COLORS: Record<TopicStatus, string> = {
  not_started: 'secondary',
  in_progress: 'warning',
  complete: 'success',
  needs_review: 'info',
}

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  video: 'Video',
  article: 'Article',
  course: 'Course',
  docs: 'Docs',
  book: 'Book',
  tool: 'Tool',
  practice: 'Practice',
  repo: 'Repo',
}

const PRIORITY_STYLES: Record<string, string> = {
  must: 'bg-teal-600/15 text-teal-500 border-teal-600/30',
  recommended: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  optional: 'bg-secondary text-muted-foreground border-border',
}

const PRIORITY_LABELS: Record<string, string> = {
  must: 'Must',
  recommended: 'Recommended',
  optional: 'Optional',
}

interface TopicRowProps {
  topicKey: string
  title: string
  description: string
  tools: string[]
  whyItMatters: string
  resources: CurriculumResource[]
  isLab: boolean
  progress: TopicProgress | undefined
}

export function TopicRow({
  topicKey,
  title,
  description,
  tools,
  whyItMatters,
  resources,
  isLab,
  progress,
}: TopicRowProps) {
  const [expanded, setExpanded] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [localStatus, setLocalStatus] = useState<TopicStatus>(
    progress?.status ?? 'not_started'
  )
  const [localDepth, setLocalDepth] = useState<DepthLevel>(
    (progress?.depth_level ?? 0) as DepthLevel
  )

  async function updateProgress(
    field: 'status' | 'depth_level',
    value: string | number
  ) {
    startTransition(async () => {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic_key: topicKey, [field]: value }),
      })
    })
  }

  function handleStatusChange(status: TopicStatus) {
    setLocalStatus(status)
    updateProgress('status', status)
  }

  function handleDepthChange(depth: DepthLevel) {
    setLocalDepth(depth)
    updateProgress('depth_level', depth)
  }

  const statusVariant = STATUS_COLORS[localStatus] as Parameters<typeof Badge>[0]['variant']

  return (
    <div className={cn('transition-colors', expanded && 'bg-secondary/30')}>
      {/* Row header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/20 transition-colors min-h-[48px]"
      >
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium">{title}</span>
          {!expanded && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <Badge variant={statusVariant} className="text-xs hidden sm:inline-flex">
            {STATUS_OPTIONS.find(s => s.value === localStatus)?.label}
          </Badge>
          {isPending && (
            <div className="w-3 h-3 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
          )}
        </div>
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border/50">
          <p className="text-sm text-muted-foreground pt-3">{description}</p>

          {whyItMatters && (
            <div className="bg-teal-600/5 border border-teal-600/20 rounded-md p-3">
              <p className="text-xs font-medium text-teal-400 mb-1">Why this matters</p>
              <p className="text-xs text-muted-foreground">{whyItMatters}</p>
            </div>
          )}

          {tools.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tools.map(tool => (
                <Badge key={tool} variant="outline" className="text-xs">
                  {tool}
                </Badge>
              ))}
            </div>
          )}

          {/* Status + depth controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Status</p>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleStatusChange(opt.value)}
                    className={cn(
                      'px-2.5 py-1 rounded-md text-xs border transition-colors',
                      localStatus === opt.value
                        ? 'border-teal-600 bg-teal-600/15 text-teal-400'
                        : 'border-border text-muted-foreground hover:border-teal-600/50'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {!isLab && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Depth level</p>
                <div className="flex flex-wrap gap-1.5">
                  {DEPTH_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => handleDepthChange(opt.value)}
                      className={cn(
                        'px-2.5 py-1 rounded-md text-xs border transition-colors',
                        localDepth === opt.value
                          ? 'border-teal-600 bg-teal-600/15 text-teal-400'
                          : 'border-border text-muted-foreground hover:border-teal-600/50'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Resources */}
          {resources.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Where to Study</p>
              <div className="space-y-1.5">
                {resources.map((r, idx) => (
                  <a
                    key={idx}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2.5 rounded-md p-2.5 border border-border hover:border-teal-600/40 hover:bg-secondary/40 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-medium group-hover:text-teal-500 transition-colors">{r.title}</span>
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium', PRIORITY_STYLES[r.priority])}>
                          {PRIORITY_LABELS[r.priority]}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary border border-border text-muted-foreground">
                          {RESOURCE_TYPE_LABELS[r.type] ?? r.type}
                        </span>
                        {r.isFree ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 border border-green-500/30 text-green-600">Free</span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary border border-border text-muted-foreground">Paid</span>
                        )}
                      </div>
                      {r.note && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">{r.note}</p>
                      )}
                    </div>
                    <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-teal-500 transition-colors flex-shrink-0 mt-0.5" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <Link
              href={`/chat?topic=${topicKey}&mode=teaching`}
              className="inline-flex items-center gap-1.5 text-xs text-teal-400 hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              Ask AI Coach about this
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
