'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  FileText,
  MoreHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const PRIMARY_TABS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/chat', label: 'AI Coach', icon: MessageSquare },
  { href: '/curriculum', label: 'Curriculum', icon: BookOpen },
  { href: '/notes', label: 'Notes', icon: FileText },
  { href: '/projects', label: 'More', icon: MoreHorizontal },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-pb">
      <div className="flex items-center justify-around">
        {PRIMARY_TABS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 py-2 px-3 min-w-[64px] min-h-[56px] justify-center transition-colors',
                isActive
                  ? 'text-teal-400'
                  : 'text-muted-foreground'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] leading-none">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
