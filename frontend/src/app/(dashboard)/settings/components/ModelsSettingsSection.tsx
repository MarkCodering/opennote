'use client'

import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useModelDefaults, useModels, useProviders } from '@/lib/hooks/use-models'
import { useTranslation } from '@/lib/hooks/use-translation'
import { RefreshCw } from 'lucide-react'
import { ProviderStatus } from '@/app/(dashboard)/models/components/ProviderStatus'
import { DefaultModelsSection } from '@/app/(dashboard)/models/components/DefaultModelsSection'
import { ModelTypeSection } from '@/app/(dashboard)/models/components/ModelTypeSection'

export function ModelsSettingsSection() {
  const { t } = useTranslation()
  const { data: models, isLoading: modelsLoading, refetch: refetchModels } = useModels()
  const { data: defaults, isLoading: defaultsLoading, refetch: refetchDefaults } = useModelDefaults()
  const { data: providers, isLoading: providersLoading, refetch: refetchProviders } = useProviders()

  const isLoading = modelsLoading || defaultsLoading || providersLoading

  const handleRefresh = () => {
    refetchModels()
    refetchDefaults()
    refetchProviders()
  }

  let content: ReactNode

  if (isLoading) {
    content = (
      <div className="flex items-center justify-center min-h-[40vh]">
        <LoadingSpinner size="lg" />
      </div>
    )
  } else if (!models || !defaults || !providers) {
    content = (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t.models.failedToLoad}</p>
      </div>
    )
  } else {
    content = (
      <div className="grid gap-6">
        <ProviderStatus providers={providers} />
        <DefaultModelsSection models={models} defaults={defaults} />
        <div className="grid gap-6 lg:grid-cols-2">
          <ModelTypeSection
            type="language"
            models={models}
            providers={providers}
            isLoading={modelsLoading}
          />
          <ModelTypeSection
            type="embedding"
            models={models}
            providers={providers}
            isLoading={modelsLoading}
          />
          <ModelTypeSection
            type="text_to_speech"
            models={models}
            providers={providers}
            isLoading={modelsLoading}
          />
          <ModelTypeSection
            type="speech_to_text"
            models={models}
            providers={providers}
            isLoading={modelsLoading}
          />
        </div>
      </div>
    )
  }

  return (
    <section id="models" className="scroll-mt-24 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{t.models.title}</h2>
          <p className="text-muted-foreground mt-1">
            {t.models.desc}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {content}
    </section>
  )
}
