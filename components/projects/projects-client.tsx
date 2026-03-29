'use client'

import { useState } from 'react'
import { ExternalLink, ChevronDown, ChevronRight, MessageSquare } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { Project, ProjectStatus, Milestone } from '@/lib/types'
import type { PortfolioProject } from '@/lib/types'
import Link from 'next/link'

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'planning', label: 'Planning' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'complete', label: 'Complete' },
  { value: 'polished', label: 'Polished' },
]

const STATUS_COLORS: Record<ProjectStatus, Parameters<typeof Badge>[0]['variant']> = {
  not_started: 'secondary',
  planning: 'info',
  in_progress: 'warning',
  complete: 'success',
  polished: 'teal',
}

interface ProjectsClientProps {
  projects: Project[]
  portfolioProjects: PortfolioProject[]
}

export function ProjectsClient({ projects: initialProjects, portfolioProjects }: ProjectsClientProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [expanded, setExpanded] = useState<string | null>(null)

  function getProject(key: string) {
    return projects.find(p => p.project_key === key)
  }

  async function updateProject(projectKey: string, updates: Partial<Project>) {
    const project = getProject(projectKey)
    if (!project) return

    setProjects(prev =>
      prev.map(p => p.project_key === projectKey ? { ...p, ...updates } : p)
    )

    await fetch('/api/projects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: project.id, ...updates }),
    })
  }

  async function toggleMilestone(projectKey: string, milestoneIndex: number) {
    const project = getProject(projectKey)
    if (!project) return

    const milestones = [...project.milestones]
    milestones[milestoneIndex] = {
      ...milestones[milestoneIndex],
      completed: !milestones[milestoneIndex].completed,
    }
    await updateProject(projectKey, { milestones })
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Portfolio Projects</h1>
        <p className="text-sm text-muted-foreground">
          {projects.filter(p => p.status === 'complete' || p.status === 'polished').length} of {portfolioProjects.length} complete
        </p>
      </div>

      <div className="space-y-3">
        {portfolioProjects.map((pp, idx) => {
          const project = getProject(pp.key)
          if (!project) return null

          const status = project.status as ProjectStatus
          const milestones = project.milestones as Milestone[]
          const completedMilestones = milestones.filter(m => m.completed).length
          const isExpanded = expanded === pp.key

          return (
            <div key={pp.key} className="border border-border rounded-lg overflow-hidden">
              {/* Header */}
              <button
                onClick={() => setExpanded(isExpanded ? null : pp.key)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-secondary/50 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">
                      {idx + 1}. {pp.title}
                    </span>
                    <Badge variant={STATUS_COLORS[status]} className="text-xs">
                      {STATUS_OPTIONS.find(s => s.value === status)?.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {completedMilestones}/{milestones.length} milestones
                  </p>
                </div>
              </button>

              {/* Expanded */}
              {isExpanded && (
                <div className="border-t border-border p-4 space-y-5">
                  <p className="text-sm text-muted-foreground">{pp.description}</p>

                  {/* Status selector */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Status</p>
                    <div className="flex flex-wrap gap-1.5">
                      {STATUS_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => updateProject(pp.key, { status: opt.value })}
                          className={cn(
                            'px-2.5 py-1 rounded-md text-xs border transition-colors',
                            status === opt.value
                              ? 'border-teal-600 bg-teal-600/15 text-teal-400'
                              : 'border-border text-muted-foreground hover:border-teal-600/50'
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* GitHub URL */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">GitHub Repository</p>
                    <div className="flex gap-2">
                      <Input
                        value={project.github_url ?? ''}
                        onChange={e => updateProject(pp.key, { github_url: e.target.value })}
                        placeholder="https://github.com/username/repo"
                        className="h-8 text-sm font-mono"
                        onBlur={e => updateProject(pp.key, { github_url: e.target.value || null })}
                      />
                      {project.github_url && (
                        <a
                          href={project.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-teal-400 hover:underline whitespace-nowrap"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Open
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Milestones */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Milestones ({completedMilestones}/{milestones.length})
                    </p>
                    <div className="space-y-1.5">
                      {milestones.map((m, i) => (
                        <button
                          key={i}
                          onClick={() => toggleMilestone(pp.key, i)}
                          className="flex items-start gap-2.5 w-full text-left group"
                        >
                          <div className={cn(
                            'w-4 h-4 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors',
                            m.completed
                              ? 'bg-teal-600 border-teal-600'
                              : 'border-border group-hover:border-teal-600/50'
                          )}>
                            {m.completed && (
                              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className={cn(
                            'text-xs leading-relaxed',
                            m.completed ? 'text-muted-foreground line-through' : 'text-foreground'
                          )}>
                            {m.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Skills demonstrated</p>
                    <div className="flex flex-wrap gap-1.5">
                      {pp.skills.map(skill => (
                        <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Resume talking points */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Resume talking points</p>
                    <p className="text-xs text-muted-foreground bg-secondary/50 rounded-md p-3 leading-relaxed">
                      {project.resume_talking_points}
                    </p>
                  </div>

                  {/* Interview this project */}
                  <div className="flex gap-2">
                    <Link
                      href={`/chat?mode=interview`}
                      className="inline-flex items-center gap-1.5 text-xs text-teal-400 hover:underline"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Interview me on this project
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
