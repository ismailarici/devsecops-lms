'use client'

import { useState } from 'react'
import { ExternalLink, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ResourceStatus } from '@/lib/types'

export interface FlatResource {
  key: string // unique: topicKey + index
  title: string
  url: string
  type: string
  isFree: boolean
  priority: string
  note?: string
  phase: number
  phaseTitle: string
  topicTitle: string
  status: ResourceStatus
}

interface ResourcesClientProps {
  resources: FlatResource[]
  statusMap: Map<string, ResourceStatus>
}

const PRIORITY_STYLES: Record<string, string> = {
  must: 'bg-teal-600/15 text-teal-500 border-teal-600/30',
  recommended: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  optional: 'bg-secondary text-muted-foreground border-border',
}

const STATUS_OPTIONS: { value: ResourceStatus; label: string }[] = [
  { value: 'not_started', label: 'Not started' },
  { value: 'reading', label: 'Reading' },
  { value: 'complete', label: 'Complete' },
]

const STATUS_STYLES: Record<ResourceStatus, string> = {
  not_started: 'border-border text-muted-foreground',
  reading: 'border-amber-500/50 bg-amber-500/10 text-amber-600',
  complete: 'border-teal-600/50 bg-teal-600/10 text-teal-500',
}

const TYPE_LABELS: Record<string, string> = {
  video: 'Video', article: 'Article', course: 'Course', docs: 'Docs',
  book: 'Book', tool: 'Tool', practice: 'Practice', repo: 'Repo',
}

export function ResourcesClient({ resources, statusMap }: ResourcesClientProps) {
  const [search, setSearch] = useState('')
  const [filterPhase, setFilterPhase] = useState<number | 'all'>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [localStatuses, setLocalStatuses] = useState<Map<string, ResourceStatus>>(new Map(statusMap))

  const phases = Array.from(new Set(resources.map(r => r.phase))).sort()
  const types = Array.from(new Set(resources.map(r => r.type))).sort()

  const filtered = resources.filter(r => {
    if (filterPhase !== 'all' && r.phase !== filterPhase) return false
    if (filterType !== 'all' && r.type !== filterType) return false
    if (filterPriority !== 'all' && r.priority !== filterPriority) return false
    const status = localStatuses.get(r.key) ?? 'not_started'
    if (filterStatus !== 'all' && status !== filterStatus) return false
    if (search) {
      const q = search.toLowerCase()
      if (!r.title.toLowerCase().includes(q) && !r.topicTitle.toLowerCase().includes(q)) return false
    }
    return true
  })

  const total = resources.length
  const completed = Array.from(localStatuses.values()).filter(s => s === 'complete').length

  async function updateStatus(key: string, status: ResourceStatus) {
    setLocalStatuses(prev => new Map(prev).set(key, status))
    await fetch('/api/resources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resource_key: key, status }),
    })
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-muted-foreground">{total} resources</span>
        <span className="text-teal-500 font-medium">{completed} complete</span>
        <span className="text-muted-foreground">{total - completed} remaining</span>
      </div>

      {/* Search + filters */}
      <div className="space-y-2">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search resources…"
            className="pl-8 h-9 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Phase filter */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs text-muted-foreground mr-1">Phase:</span>
            {(['all', ...phases] as (number | 'all')[]).map(p => (
              <button
                key={p}
                onClick={() => setFilterPhase(p)}
                className={cn(
                  'px-2 py-0.5 rounded text-xs border transition-colors',
                  filterPhase === p ? 'border-teal-600 bg-teal-600/15 text-teal-500' : 'border-border text-muted-foreground hover:border-teal-600/40'
                )}
              >
                {p === 'all' ? 'All' : `P${p}`}
              </button>
            ))}
          </div>

          {/* Priority filter */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs text-muted-foreground mr-1">Priority:</span>
            {['all', 'must', 'recommended', 'optional'].map(p => (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                className={cn(
                  'px-2 py-0.5 rounded text-xs border transition-colors capitalize',
                  filterPriority === p ? 'border-teal-600 bg-teal-600/15 text-teal-500' : 'border-border text-muted-foreground hover:border-teal-600/40'
                )}
              >
                {p === 'all' ? 'All' : p}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs text-muted-foreground mr-1">Status:</span>
            {['all', 'not_started', 'reading', 'complete'].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={cn(
                  'px-2 py-0.5 rounded text-xs border transition-colors',
                  filterStatus === s ? 'border-teal-600 bg-teal-600/15 text-teal-500' : 'border-border text-muted-foreground hover:border-teal-600/40'
                )}
              >
                {s === 'all' ? 'All' : s === 'not_started' ? 'Not started' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs text-muted-foreground mr-1">Type:</span>
            {(['all', ...types]).map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={cn(
                  'px-2 py-0.5 rounded text-xs border transition-colors',
                  filterType === t ? 'border-teal-600 bg-teal-600/15 text-teal-500' : 'border-border text-muted-foreground hover:border-teal-600/40'
                )}
              >
                {t === 'all' ? 'All' : TYPE_LABELS[t] ?? t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No resources match your filters.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => {
            const status = localStatuses.get(r.key) ?? 'not_started'
            return (
              <div key={r.key} className="border border-border rounded-lg p-3 space-y-2 hover:border-border/80 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium hover:text-teal-500 transition-colors inline-flex items-center gap-1"
                      >
                        {r.title}
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap mt-1">
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium', PRIORITY_STYLES[r.priority])}>
                        {r.priority.charAt(0).toUpperCase() + r.priority.slice(1)}
                      </span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{TYPE_LABELS[r.type] ?? r.type}</Badge>
                      {r.isFree ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 border border-green-500/30 text-green-600">Free</span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary border border-border text-muted-foreground">Paid</span>
                      )}
                      <span className="text-[10px] text-muted-foreground">Phase {r.phase} · {r.topicTitle}</span>
                    </div>
                    {r.note && <p className="text-xs text-muted-foreground mt-1">{r.note}</p>}
                  </div>
                </div>

                {/* Status selector */}
                <div className="flex gap-1.5">
                  {STATUS_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => updateStatus(r.key, opt.value)}
                      className={cn(
                        'px-2.5 py-1 rounded text-xs border transition-colors',
                        status === opt.value ? STATUS_STYLES[opt.value] : 'border-border text-muted-foreground hover:border-foreground/30'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
