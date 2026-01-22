'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DefaultPromptEditor } from '@/app/(dashboard)/transformations/components/DefaultPromptEditor'
import { TransformationsList } from '@/app/(dashboard)/transformations/components/TransformationsList'
import { TransformationPlayground } from '@/app/(dashboard)/transformations/components/TransformationPlayground'
import { useTransformations } from '@/lib/hooks/use-transformations'
import { Transformation } from '@/lib/types/transformations'
import { RefreshCw, Wand2, Play } from 'lucide-react'
import { useTranslation } from '@/lib/hooks/use-translation'

export function TransformationsSettingsSection() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('transformations')
  const [selectedTransformation, setSelectedTransformation] = useState<Transformation | undefined>()
  const { data: transformations, isLoading, refetch } = useTransformations()

  const handlePlayground = (transformation: Transformation) => {
    setSelectedTransformation(transformation)
    setActiveTab('playground')
  }

  return (
    <section id="transformations" className="scroll-mt-24 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{t.transformations.title}</h2>
          <p className="text-muted-foreground mt-1">
            {t.transformations.desc}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.transformations.workspace}</p>
          <TabsList aria-label={t.common.accessibility.transformationViews} className="w-full max-w-xl">
            <TabsTrigger value="transformations" className="flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              {t.transformations.title}
            </TabsTrigger>
            <TabsTrigger value="playground" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              {t.transformations.playground}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="transformations" className="space-y-6">
          <DefaultPromptEditor />
          <TransformationsList
            transformations={transformations}
            isLoading={isLoading}
            onPlayground={handlePlayground}
          />
        </TabsContent>

        <TabsContent value="playground">
          <TransformationPlayground
            transformations={transformations}
            selectedTransformation={selectedTransformation}
          />
        </TabsContent>
      </Tabs>
    </section>
  )
}
