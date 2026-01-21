'use client'

import { useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { AppSidebar } from './AppSidebar'
import { useTranslation } from '@/lib/hooks/use-translation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Command, Sparkles } from 'lucide-react'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { t } = useTranslation()
  const pathname = usePathname()

  const sectionLabel = useMemo(() => {
    if (!pathname) return t.common.workspace
    if (pathname.startsWith('/notebooks')) return t.navigation.notebooks
    if (pathname.startsWith('/sources')) return t.navigation.sources
    if (pathname.startsWith('/search')) return t.navigation.askAndSearch
    if (pathname.startsWith('/podcasts')) return t.navigation.podcasts
    if (pathname.startsWith('/models')) return t.navigation.models
    if (pathname.startsWith('/transformations')) return t.navigation.transformations
    if (pathname.startsWith('/settings')) return t.navigation.settings
    if (pathname.startsWith('/advanced')) return t.navigation.advanced
    return t.common.workspace
  }, [pathname, t])

  const handleOpenCommandMenu = () => {
    const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true })
    document.dispatchEvent(event)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <div className="flex-1 flex min-h-0 flex-col overflow-hidden bg-background/60 backdrop-blur-xl">
        <header className="ide-topbar">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm ide-glow">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{t.common.workspace}</p>
              <p className="text-sm font-semibold text-foreground">{sectionLabel}</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Button variant="outline" size="sm" className="ide-command-btn" type="button" onClick={handleOpenCommandMenu}>
              <Command className="h-4 w-4" />
              <span>{t.common.commandMenu}</span>
              <kbd className="rounded bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">⌘K</kbd>
            </Button>
            <Badge variant="secondary" className="px-2 py-1 text-xs font-medium">
              {t.common.syncActive}
            </Badge>
          </div>
        </header>
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {children}
        </main>
        <footer className="ide-statusbar">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
            {t.common.statusReady}
          </div>
          <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
            <span>{t.common.aiReady}</span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
            <span>{t.common.autoSaved}</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
