'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  FileText,
  FolderKanban,
  Zap,
  Clock,
  Target,
  Library,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/curriculum', label: 'Curriculum', icon: BookOpen },
  { href: '/chat', label: 'AI Coach', icon: MessageSquare },
  { href: '/notes', label: 'Notes', icon: FileText },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/skills', label: 'Skills', icon: Zap },
  { href: '/log', label: 'Study Log', icon: Clock },
  { href: '/interview', label: 'Interview Prep', icon: Target },
  { href: '/resources', label: 'Resources', icon: Library },
  { href: '/settings', label: 'Settings', icon: Settings },
]

interface SidebarProps {
  currentPhase?: number
}

export function Sidebar({ currentPhase = 1 }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col h-full bg-card border-r border-border transition-all duration-200',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 p-4 border-b border-border', collapsed && 'justify-center')}>
        <div className="flex-shrink-0 w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
          <Shield className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-semibold leading-tight">SecEng Coach</p>
            <p className="text-xs text-muted-foreground">Phase {currentPhase} of 6</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors min-h-[44px]',
                isActive
                  ? 'bg-teal-600/15 text-teal-400 font-medium'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center p-3 border-t border-border text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  )
}
