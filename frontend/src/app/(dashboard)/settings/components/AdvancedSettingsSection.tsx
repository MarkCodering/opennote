'use client'

import { RebuildEmbeddings } from '@/app/(dashboard)/advanced/components/RebuildEmbeddings'
import { SystemInfo } from '@/app/(dashboard)/advanced/components/SystemInfo'
import { useTranslation } from '@/lib/hooks/use-translation'

export function AdvancedSettingsSection() {
  const { t } = useTranslation()

  return (
    <section id="advanced" className="scroll-mt-24 space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t.advanced.title}</h2>
        <p className="text-muted-foreground mt-1">
          {t.advanced.desc}
        </p>
      </div>

      <SystemInfo />
      <RebuildEmbeddings />
    </section>
  )
}
