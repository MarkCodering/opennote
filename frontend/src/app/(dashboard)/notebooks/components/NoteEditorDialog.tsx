'use client'

import { Controller, useForm, useWatch } from 'react-hook-form'
import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useCreateNote, useUpdateNote, useNote } from '@/lib/hooks/use-notes'
import { QUERY_KEYS } from '@/lib/api/query-client'
import { MarkdownEditor } from '@/components/ui/markdown-editor'
import { InlineEdit } from '@/components/common/InlineEdit'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/hooks/use-translation'
import { Blocks, Heading2, ListChecks, Quote, Code2, Table2 } from 'lucide-react'

const createNoteSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
})

type CreateNoteFormData = z.infer<typeof createNoteSchema>

interface NoteEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  notebookId: string
  note?: { id: string; title: string | null; content: string | null }
}

export function NoteEditorDialog({ open, onOpenChange, notebookId, note }: NoteEditorDialogProps) {
  const { t } = useTranslation()
  const createNote = useCreateNote()
  const updateNote = useUpdateNote()
  const queryClient = useQueryClient()
  const isEditing = Boolean(note)

  // Ensure note ID has 'note:' prefix for API calls
  const noteIdWithPrefix = note?.id
    ? (note.id.includes(':') ? note.id : `note:${note.id}`)
    : ''

  const { data: fetchedNote, isLoading: noteLoading } = useNote(noteIdWithPrefix, { enabled: open && !!note?.id })
  const isSaving = isEditing ? updateNote.isPending : createNote.isPending
  const {
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CreateNoteFormData>({
    resolver: zodResolver(createNoteSchema),
    defaultValues: {
      title: '',
      content: '',
    },
  })
  const watchTitle = useWatch({ control, name: 'title' })
  const watchContent = useWatch({ control, name: 'content' })
  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false)

  const slashCommands = useMemo(() => ([
    {
      id: 'heading',
      label: t.sources.slashHeading,
      description: t.sources.slashHeadingDesc,
      snippet: '## Heading',
      icon: Heading2,
    },
    {
      id: 'todo',
      label: t.sources.slashTodo,
      description: t.sources.slashTodoDesc,
      snippet: '- [ ] Task',
      icon: ListChecks,
    },
    {
      id: 'callout',
      label: t.sources.slashCallout,
      description: t.sources.slashCalloutDesc,
      snippet: '> 💡 Callout',
      icon: Quote,
    },
    {
      id: 'code',
      label: t.sources.slashCode,
      description: t.sources.slashCodeDesc,
      snippet: '```js\n// code\n```',
      icon: Code2,
    },
    {
      id: 'table',
      label: t.sources.slashTable,
      description: t.sources.slashTableDesc,
      snippet: '| Column | Column |\n| --- | --- |\n| Cell | Cell |',
      icon: Table2,
    },
  ]), [t])

  const slashMatch = useMemo(() => {
    if (!watchContent) return null
    return watchContent.match(/(?:^|\n)\/([a-zA-Z]*)$/)
  }, [watchContent])

  const slashQuery = slashMatch?.[1]?.toLowerCase() ?? ''
  const filteredCommands = useMemo(() => {
    if (!slashMatch) return []
    if (!slashQuery) return slashCommands
    return slashCommands.filter((command) =>
      command.label.toLowerCase().includes(slashQuery)
    )
  }, [slashCommands, slashMatch, slashQuery])

  const insertSlashCommand = (snippet: string) => {
    const current = watchContent ?? ''
    const pattern = /(?:^|\n)\/[^\n]*$/
    let nextValue = current

    if (pattern.test(current)) {
      nextValue = current.replace(pattern, (match) => {
        const prefix = match.startsWith('\n') ? '\n' : ''
        return `${prefix}${snippet}`
      })
    } else {
      nextValue = current ? `${current}\n${snippet}` : snippet
    }

    setValue('content', nextValue, { shouldDirty: true })
  }

  useEffect(() => {
    if (!open) {
      reset({ title: '', content: '' })
      return
    }

    const source = fetchedNote ?? note
    const title = source?.title ?? ''
    const content = source?.content ?? ''

    reset({ title, content })
  }, [open, note, fetchedNote, reset])

  useEffect(() => {
    if (!open) return

    const observer = new MutationObserver(() => {
      setIsEditorFullscreen(!!document.querySelector('.w-md-editor-fullscreen'))
    })
    observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [open])

  const onSubmit = async (data: CreateNoteFormData) => {
    if (note) {
      await updateNote.mutateAsync({
        id: noteIdWithPrefix,
        data: {
          title: data.title || undefined,
          content: data.content,
        },
      })
      // Only invalidate notebook-specific queries if we have a notebookId
      if (notebookId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notes(notebookId) })
      }
    } else {
      // Creating a note requires a notebookId
      if (!notebookId) {
        console.error('Cannot create note without notebook_id')
        return
      }
      await createNote.mutateAsync({
        title: data.title || undefined,
        content: data.content,
        note_type: 'human',
        notebook_id: notebookId,
      })
    }
    reset()
    onOpenChange(false)
  }

  const handleClose = () => {
    reset()
    setIsEditorFullscreen(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={cn(
          "sm:max-w-3xl w-full max-h-[90vh] overflow-hidden p-0",
          isEditorFullscreen && "!max-w-screen !max-h-screen border-none w-screen h-screen"
      )}>
        <DialogTitle className="sr-only">
          {isEditing ? t.sources.editNote : t.sources.createNote}
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)} className="flex h-full flex-col">
          {isEditing && noteLoading ? (
            <div className="flex-1 flex items-center justify-center py-10">
              <span className="text-sm text-muted-foreground">{t.common.loading}</span>
            </div>
          ) : (
            <>
              <div className="border-b px-6 py-4">
                <InlineEdit
                  id="note-title"
                  name="title"
                  value={watchTitle ?? ''}
                  onSave={(value) => setValue('title', value || '')}
                  placeholder={t.sources.addTitle}
                  emptyText={t.sources.untitledNote}
                  className="text-xl font-semibold"
                  inputClassName="text-xl font-semibold"
                />
              </div>

              <div className={cn(
                  "flex-1 overflow-y-auto",
                  !isEditorFullscreen && "px-6 py-4")
              }>
                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-2 rounded-full border border-border/60 px-3 py-1">
                    <Blocks className="h-3.5 w-3.5 text-primary" />
                    {t.sources.slashHint}
                  </span>
                  <span className="rounded-full bg-muted/70 px-3 py-1">
                    {t.sources.markdownHint}
                  </span>
                </div>
                <Controller
                  control={control}
                  name="content"
                  render={({ field }) => (
                    <div className="relative">
                      <MarkdownEditor
                        key={note?.id ?? 'new'}
                        textareaId="note-content"
                        value={field.value}
                        onChange={field.onChange}
                        height={420}
                        placeholder={t.sources.writeNotePlaceholder}
                        className={cn(
                            "w-full h-full min-h-[420px] [&_.w-md-editor]:!static [&_.w-md-editor]:!w-full [&_.w-md-editor]:!h-full",
                            !isEditorFullscreen && "rounded-md border"
                        )}
                      />
                      {slashMatch && (
                        <div className="note-command-menu">
                          <div className="flex items-center gap-2 px-3 pt-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            <Blocks className="h-3.5 w-3.5 text-primary" />
                            {t.sources.slashMenuTitle}
                          </div>
                          <div className="p-2 space-y-1">
                            {filteredCommands.length > 0 ? (
                              filteredCommands.map((command) => (
                                <button
                                  key={command.id}
                                  type="button"
                                  className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-muted/70"
                                  onClick={() => insertSlashCommand(command.snippet)}
                                >
                                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-foreground">
                                    <command.icon className="h-4 w-4" />
                                  </span>
                                  <span className="flex-1">
                                    <span className="font-medium">{command.label}</span>
                                    <span className="block text-xs text-muted-foreground">{command.description}</span>
                                  </span>
                                </button>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-xs text-muted-foreground">
                                {t.sources.slashMenuEmpty}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                />
                {errors.content && (
                  <p className="text-sm text-red-600 mt-1">{errors.content.message}</p>
                )}
              </div>
            </>
          )}

          <div className="border-t px-6 py-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              {t.common.cancel}
            </Button>
            <Button
              type="submit"
              disabled={isSaving || (isEditing && noteLoading)}
            >
              {isSaving
                ? isEditing ? `${t.common.saving}...` : `${t.common.creating}...`
                : isEditing
                  ? t.sources.saveNote
                  : t.sources.createNoteBtn}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
