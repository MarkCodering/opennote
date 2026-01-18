'use client'

import { AppSidebar } from './AppSidebar'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden bg-background/60 backdrop-blur-xl">
        {children}
      </main>
    </div>
  )
}
