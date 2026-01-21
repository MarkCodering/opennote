'use client'

import { useMemo, useState } from 'react'

import { AppShell } from '@/components/layout/AppShell'
import { NotebookList } from './components/NotebookList'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, RefreshCw, Sparkles, LayoutPanelLeft } from 'lucide-react'
import { useNotebooks } from '@/lib/hooks/use-notebooks'
import { CreateNotebookDialog } from '@/components/notebooks/CreateNotebookDialog'
import { Input } from '@/components/ui/input'
import { useTranslation } from '@/lib/hooks/use-translation'

export default function NotebooksPage() {
  const { t } = useTranslation()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const { data: notebooks, isLoading, refetch } = useNotebooks(false)
  const { data: archivedNotebooks } = useNotebooks(true)

  const normalizedQuery = searchTerm.trim().toLowerCase()

  const filteredActive = useMemo(() => {
    if (!notebooks) {
      return undefined
    }
    if (!normalizedQuery) {
      return notebooks
    }
    return notebooks.filter((notebook) =>
      notebook.name.toLowerCase().includes(normalizedQuery)
    )
  }, [notebooks, normalizedQuery])

  const filteredArchived = useMemo(() => {
    if (!archivedNotebooks) {
      return undefined
    }
    if (!normalizedQuery) {
      return archivedNotebooks
    }
    return archivedNotebooks.filter((notebook) =>
      notebook.name.toLowerCase().includes(normalizedQuery)
    )
  }, [archivedNotebooks, normalizedQuery])

  const hasArchived = (archivedNotebooks?.length ?? 0) > 0
  const isSearching = normalizedQuery.length > 0

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          <div className="ide-panel ide-grid rounded-3xl p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <Badge variant="secondary" className="w-fit gap-2">
                  <LayoutPanelLeft className="h-4 w-4" />
                  {t.notebooks.ideSubtitle}
                </Badge>
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight">{t.notebooks.title}</h1>
                  <p className="text-sm text-muted-foreground">
                    {t.notebooks.ideDescription}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-2 rounded-full bg-muted/70 px-3 py-1">
                    <Sparkles className="h-3 w-3 text-primary" />
                    {t.notebooks.ideHint}
                  </span>
                  <span className="rounded-full border border-border/60 px-3 py-1">
                    {t.notebooks.ideShortcut}
                  </span>
                </div>
              </div>
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <Input
                  id="notebook-search"
                  name="notebook-search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={t.notebooks.searchPlaceholder}
                  autoComplete="off"
                  aria-label={t.common.accessibility?.searchNotebooks || "Search notebooks"}
                  className="w-full sm:w-72"
                />
                <div className="flex gap-3">
                  <Button variant="outline" size="icon" onClick={() => refetch()} aria-label={t.common.refresh}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t.notebooks.newNotebook}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <NotebookList 
              notebooks={filteredActive} 
              isLoading={isLoading}
              title={t.notebooks.activeNotebooks}
              emptyTitle={isSearching ? t.common.noMatches : undefined}
              emptyDescription={isSearching ? t.common.tryDifferentSearch : undefined}
              onAction={!isSearching ? () => setCreateDialogOpen(true) : undefined}
              actionLabel={!isSearching ? t.notebooks.newNotebook : undefined}
            />
            
            {hasArchived && (
              <NotebookList 
                notebooks={filteredArchived} 
                isLoading={false}
                title={t.notebooks.archivedNotebooks}
                collapsible
                emptyTitle={isSearching ? t.common.noMatches : undefined}
                emptyDescription={isSearching ? t.common.tryDifferentSearch : undefined}
              />
            )}
          </div>
        </div>
      </div>

      <CreateNotebookDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </AppShell>
  )
}
