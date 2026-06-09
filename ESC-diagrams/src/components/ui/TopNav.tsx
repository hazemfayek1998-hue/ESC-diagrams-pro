'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Heart, BookOpen, Home, Settings, Key } from 'lucide-react'
import ApiKeyModal from '@/components/settings/ApiKeyModal'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/', icon: Home, label: 'Library' },
  { href: '/study', icon: BookOpen, label: 'Study' },
]

export default function TopNav() {
  const pathname = usePathname()
  const [apiKeyOpen, setApiKeyOpen] = useState(false)

  // Don't show nav on full-screen pages (editor, study canvas, exam)
  const isFullScreen =
    pathname.startsWith('/editor/') ||
    (pathname.startsWith('/study/') && pathname !== '/study') ||
    pathname.startsWith('/exam/')

  if (isFullScreen) return null

  return (
    <>
      <header className="h-14 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] flex items-center px-6 gap-4 sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2 mr-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-medical-blue/20 border border-medical-blue/40 flex items-center justify-center">
            <Heart className="w-4 h-4 text-medical-blue" strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-sm tracking-wide text-white">
            ESC<span className="text-medical-blue">·</span>Study
          </span>
        </Link>

        <nav className="flex items-center gap-1 flex-1">
          {NAV.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors',
                pathname === href
                  ? 'bg-medical-blue/15 text-medical-blue'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          ))}
        </nav>

        <button
          onClick={() => setApiKeyOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Settings</span>
        </button>
      </header>

      {apiKeyOpen && <ApiKeyModal onClose={() => setApiKeyOpen(false)} />}
    </>
  )
}
