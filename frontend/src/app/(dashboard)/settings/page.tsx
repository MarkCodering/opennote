'use client'

import { AppShell } from '@/components/layout/AppShell'
import { SettingsForm } from './components/SettingsForm'
import { ModelsSettingsSection } from './components/ModelsSettingsSection'
import { TransformationsSettingsSection } from './components/TransformationsSettingsSection'
import { AdvancedSettingsSection } from './components/AdvancedSettingsSection'
import { useSettings } from '@/lib/hooks/use-settings'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { useTranslation } from '@/lib/hooks/use-translation'

export default function SettingsPage() {
  const { t } = useTranslation()
  const { refetch } = useSettings()

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="max-w-6xl space-y-12">
            <div className="flex items-center gap-4 mb-6">
              <h1 className="text-2xl font-bold">{t.navigation.settings}</h1>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <section id="general-settings" className="scroll-mt-24">
              <SettingsForm />
            </section>
            <ModelsSettingsSection />
            <TransformationsSettingsSection />
            <AdvancedSettingsSection />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
