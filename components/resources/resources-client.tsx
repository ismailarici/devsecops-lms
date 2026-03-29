'use client'

import { useState } from 'react'
import { ExternalLink, Search, Plus, X, Loader2, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ResourceStatus } from '@/lib/types'

export interface FlatResource {
  key: string
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

export interface CustomResource {
  id: string
  title: string
  url: string
  category: string
  priority: string
  isFree: boolean
  notes: string | null
  status: ResourceStatus
}

interface ResourcesClientProps {
  resources: FlatResource[]
  statusMap: Map<string, ResourceStatus>
  customResources: CustomResource[]
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

const TABS = ['Curriculum', 'My Resources'] as const
type Tab = typeof TABS[number]

export function ResourcesClient({ resources, statusMap, customResources: initialCustom }: ResourcesClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Curriculum')
  const [search, setSearch] = useState('')
  const [filterPhase, setFilterPhase] = useState<number | 'all'>('all')
  const [filterType, setFilterType] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [localStatuses, setLocalStatuses] = useState<Map<string, ResourceStatus>>(new Map(statusMap))

  // Custom resources state
  const [customResources, setCustomResources] = useState<CustomResource[]>(initialCustom)
  const [showAddForm, setShowAddForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    url: '',
    category: '',
    priority: 'recommended',
    is_free: true,
    notes: '',
  })

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
    await fetch('/api/resources?action=status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resource_key: key, status }),
    })
  }

  async function handleAddCustom() {
    if (!form.title.trim() || !form.url.trim()) return
    setSaving(true)
    const res = await fetch('/api/resources?action=add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.id) {
      setCustomResources(prev => [{
        id: data.id,
        title: data.title,
        url: data.url,
        category: data.category,
        priority: data.priority,
        isFree: data.is_free,
        notes: data.notes,
        status: data.status,
      }, ...prev])
      setForm({ title: '', url: '', category: '', priority: 'recommended', is_free: true, notes: '' })
      setShowAddForm(false)
      setActiveTab('My Resources')
    }
    setSaving(false)
  }

  async function deleteCustom(id: string) {
    setCustomResources(prev => prev.filter(r => r.id !== id))
    await fetch(`/api/resources?id=${id}`, { method: 'DELETE' })
  }

  async function updateCustomStatus(id: string, status: ResourceStatus) {
    setCustomResources(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    await fetch('/api/resources?action=status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resource_key: `custom__${id}`, status }),
    })
  }

  return (
    <div className="space-y-4">
      {/* Stats + Add button */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">{total} curriculum · {customResources.length} custom</span>
          <span className="text-teal-500 font-medium">{completed} complete</span>
        </div>
        <button
          onClick={() => setShowAddForm(v => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-teal-600 text-white text-xs font-medium hover:bg-teal-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add resource
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="border border-teal-600/30 bg-teal-600/5 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Add a resource</p>
            <button onClick={() => setShowAddForm(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Title *</label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. SANS SEC504" className="h-8 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">URL *</label>
              <Input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://..." className="h-8 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Category</label>
              <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Cloud Security" className="h-8 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Priority</label>
              <div className="flex gap-1.5">
                {['must', 'recommended', 'optional'].map(p => (
                  <button
                    key={p}
                    onClick={() => setForm(f => ({ ...f, priority: p }))}
                    className={cn(
                      'px-2.5 py-1 rounded text-xs border transition-colors capitalize',
                      form.priority === p ? 'border-teal-600 bg-teal-600/15 text-teal-500' : 'border-border text-muted-foreground hover:border-teal-600/40'
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Notes</label>
              <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Why you added this…" className="h-8 text-sm" />
            </div>
            <div className="flex items-end gap-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_free}
                  onChange={e => setForm(f => ({ ...f, is_free: e.target.checked }))}
                  className="rounded"
                />
                Free resource
              </label>
            </div>
          </div>
          <button
            onClick={handleAddCustom}
            disabled={saving || !form.title.trim() || !form.url.trim()}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-teal-600 text-white text-xs font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            {saving ? 'Saving…' : 'Save resource'}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-3 py-2 text-sm transition-colors border-b-2 -mb-px',
              activeTab === tab
                ? 'border-teal-600 text-teal-500 font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab}
            {tab === 'My Resources' && customResources.length > 0 && (
              <span className="ml-1.5 text-xs bg-secondary px-1.5 py-0.5 rounded-full">{customResources.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Curriculum tab */}
      {activeTab === 'Curriculum' && (
        <div className="space-y-4">
          {/* Search + filters */}
          <div className="space-y-2">
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search resources…" className="pl-8 h-9 text-sm" />
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-xs text-muted-foreground mr-1">Phase:</span>
                {(['all', ...phases] as (number | 'all')[]).map(p => (
                  <button key={p} onClick={() => setFilterPhase(p)} className={cn('px-2 py-0.5 rounded text-xs border transition-colors', filterPhase === p ? 'border-teal-600 bg-teal-600/15 text-teal-500' : 'border-border text-muted-foreground hover:border-teal-600/40')}>
                    {p === 'all' ? 'All' : `P${p}`}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-xs text-muted-foreground mr-1">Priority:</span>
                {['all', 'must', 'recommended', 'optional'].map(p => (
                  <button key={p} onClick={() => setFilterPriority(p)} className={cn('px-2 py-0.5 rounded text-xs border transition-colors capitalize', filterPriority === p ? 'border-teal-600 bg-teal-600/15 text-teal-500' : 'border-border text-muted-foreground hover:border-teal-600/40')}>
                    {p === 'all' ? 'All' : p}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-xs text-muted-foreground mr-1">Status:</span>
                {[['all', 'All'], ['not_started', 'Not started'], ['reading', 'Reading'], ['complete', 'Complete']].map(([val, label]) => (
                  <button key={val} onClick={() => setFilterStatus(val)} className={cn('px-2 py-0.5 rounded text-xs border transition-colors', filterStatus === val ? 'border-teal-600 bg-teal-600/15 text-teal-500' : 'border-border text-muted-foreground hover:border-teal-600/40')}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-xs text-muted-foreground mr-1">Type:</span>
                {(['all', ...types]).map(t => (
                  <button key={t} onClick={() => setFilterType(t)} className={cn('px-2 py-0.5 rounded text-xs border transition-colors', filterType === t ? 'border-teal-600 bg-teal-600/15 text-teal-500' : 'border-border text-muted-foreground hover:border-teal-600/40')}>
                    {t === 'all' ? 'All' : TYPE_LABELS[t] ?? t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No resources match your filters.</p>
          ) : (
            <div className="space-y-2">
              {filtered.map(r => {
                const status = localStatuses.get(r.key) ?? 'not_started'
                return (
                  <div key={r.key} className="border border-border rounded-lg p-3 space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:text-teal-500 transition-colors inline-flex items-center gap-1">
                          {r.title}<ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                        <div className="flex items-center gap-1.5 flex-wrap mt-1">
                          <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium', PRIORITY_STYLES[r.priority])}>
                            {r.priority.charAt(0).toUpperCase() + r.priority.slice(1)}
                          </span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{TYPE_LABELS[r.type] ?? r.type}</Badge>
                          {r.isFree
                            ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 border border-green-500/30 text-green-600">Free</span>
                            : <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary border border-border text-muted-foreground">Paid</span>
                          }
                          <span className="text-[10px] text-muted-foreground">Phase {r.phase} · {r.topicTitle}</span>
                        </div>
                        {r.note && <p className="text-xs text-muted-foreground mt-1">{r.note}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      {STATUS_OPTIONS.map(opt => (
                        <button key={opt.value} onClick={() => updateStatus(r.key, opt.value)}
                          className={cn('px-2.5 py-1 rounded text-xs border transition-colors', status === opt.value ? STATUS_STYLES[opt.value] : 'border-border text-muted-foreground hover:border-foreground/30')}>
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
      )}

      {/* My Resources tab */}
      {activeTab === 'My Resources' && (
        <div className="space-y-2">
          {customResources.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground mb-3">No custom resources yet.</p>
              <button onClick={() => setShowAddForm(true)} className="inline-flex items-center gap-1.5 text-xs text-teal-500 hover:underline">
                <Plus className="w-3.5 h-3.5" />Add your first resource
              </button>
            </div>
          ) : (
            customResources.map(r => (
              <div key={r.id} className="border border-border rounded-lg p-3 space-y-2">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:text-teal-500 transition-colors inline-flex items-center gap-1">
                      {r.title}<ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                    <div className="flex items-center gap-1.5 flex-wrap mt-1">
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium', PRIORITY_STYLES[r.priority] ?? PRIORITY_STYLES.optional)}>
                        {r.priority.charAt(0).toUpperCase() + r.priority.slice(1)}
                      </span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{r.category || 'Custom'}</Badge>
                      {r.isFree
                        ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 border border-green-500/30 text-green-600">Free</span>
                        : <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary border border-border text-muted-foreground">Paid</span>
                      }
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-600/10 border border-teal-600/20 text-teal-500">Custom</span>
                    </div>
                    {r.notes && <p className="text-xs text-muted-foreground mt-1">{r.notes}</p>}
                  </div>
                  <button onClick={() => deleteCustom(r.id)} className="flex-shrink-0 text-muted-foreground hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex gap-1.5">
                  {STATUS_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => updateCustomStatus(r.id, opt.value)}
                      className={cn('px-2.5 py-1 rounded text-xs border transition-colors', r.status === opt.value ? STATUS_STYLES[opt.value] : 'border-border text-muted-foreground hover:border-foreground/30')}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
