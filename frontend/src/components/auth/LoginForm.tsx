'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { useAuthStore } from '@/lib/stores/auth-store'
import { getConfig } from '@/lib/config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Book, Search, FileText, Sparkles } from 'lucide-react'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useTranslation } from '@/lib/hooks/use-translation'
import Image from 'next/image'

export function LoginForm() {
  const { t, language } = useTranslation()
  const [password, setPassword] = useState('')
  const { login, isLoading, error } = useAuth()
  const { authRequired, checkAuthRequired, hasHydrated, isAuthenticated } = useAuthStore()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [configInfo, setConfigInfo] = useState<{ apiUrl: string; version: string; buildTime: string } | null>(null)
  const router = useRouter()
  const highlights = [
    { icon: Book, label: t.navigation.notebooks },
    { icon: FileText, label: t.navigation.sources },
    { icon: Search, label: t.navigation.askAndSearch },
  ]

  const AuthShell = ({ children }: { children: React.ReactNode }) => (
    <div className="auth-portal min-h-screen flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-5xl">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] items-stretch">
          <div className="hidden lg:flex flex-col justify-between rounded-3xl border border-border/60 bg-card/70 p-8 shadow-sm">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Image src="/logo.svg" alt={t.common.appName} width={28} height={28} />
                </div>
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    {t.common.appName}
                  </div>
                  <div className="text-2xl font-semibold text-foreground">
                    {t.auth.loginTitle}
                  </div>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t.auth.loginDesc}
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                {t.common.appName}
              </div>
              <div className="space-y-3">
                {highlights.map((item) => (
                  <div key={item.label} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted/70 text-foreground">
                      <item.icon className="h-4 w-4" />
                    </span>
                    <span className="font-medium text-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  )

  // Load config info for debugging
  useEffect(() => {
    getConfig().then(cfg => {
      setConfigInfo({
        apiUrl: cfg.apiUrl,
        version: cfg.version,
        buildTime: cfg.buildTime,
      })
    }).catch(err => {
      console.error('Failed to load config:', err)
    })
  }, [])

  // Check if authentication is required on mount
  useEffect(() => {
    if (!hasHydrated) {
      return
    }

    const checkAuth = async () => {
      try {
        const required = await checkAuthRequired()

        // If auth is not required, redirect to notebooks
        if (!required) {
          router.push('/notebooks')
        }
      } catch (error) {
        console.error('Error checking auth requirement:', error)
        // On error, assume auth is required to be safe
      } finally {
        setIsCheckingAuth(false)
      }
    }

    // If we already know auth status, use it
    if (authRequired !== null) {
      if (!authRequired && isAuthenticated) {
        router.push('/notebooks')
      } else {
        setIsCheckingAuth(false)
      }
    } else {
      void checkAuth()
    }
  }, [hasHydrated, authRequired, checkAuthRequired, router, isAuthenticated])

  // Show loading while checking if auth is required
  if (!hasHydrated || isCheckingAuth) {
    return (
      <AuthShell>
        <Card className="auth-card w-full border border-border/60 rounded-3xl">
          <CardContent className="flex min-h-[320px] items-center justify-center">
            <LoadingSpinner />
          </CardContent>
        </Card>
      </AuthShell>
    )
  }

  // If we still don't know if auth is required (connection error), show error
  if (authRequired === null) {
    return (
      <AuthShell>
        <Card className="auth-card w-full border border-border/60 rounded-3xl">
          <CardHeader className="text-center space-y-2">
            <CardTitle>{t.common.connectionError}</CardTitle>
            <CardDescription>
              {t.common.unableToConnect}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  {error || t.auth.connectErrorHint}
                </div>
              </div>

              {configInfo && (
                <div className="space-y-2 text-xs text-muted-foreground border-t pt-3">
                  <div className="font-medium">{t.common.diagnosticInfo}:</div>
                  <div className="space-y-1 font-mono">
                    <div>{t.common.version}: {configInfo.version}</div>
                    <div>{t.common.built}: {new Date(configInfo.buildTime).toLocaleString(language === 'zh-CN' ? 'zh-CN' : language === 'zh-TW' ? 'zh-TW' : 'en-US')}</div>
                    <div className="break-all">{t.common.apiUrl}: {configInfo.apiUrl}</div>
                    <div className="break-all">{t.common.frontendUrl}: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</div>
                  </div>
                  <div className="text-xs pt-2">
                    {t.common.checkConsoleLogs}
                  </div>
                </div>
              )}

              <Button
                onClick={() => window.location.reload()}
                className="w-full"
              >
                {t.common.retryConnection}
              </Button>
            </div>
          </CardContent>
        </Card>
      </AuthShell>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.trim()) {
      try {
        await login(password)
      } catch (error) {
        console.error('Unhandled error during login:', error)
        // The auth store should handle most errors, but this catches any unhandled ones
      }
    }
  }

  return (
    <AuthShell>
      <Card className="auth-card w-full border border-border/60 rounded-3xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle>{t.auth.loginTitle}</CardTitle>
          <CardDescription>
            {t.auth.loginDesc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder={t.auth.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="h-11 text-base"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold"
              disabled={isLoading || !password.trim()}
            >
              {isLoading ? t.auth.signingIn : t.auth.signIn}
            </Button>

            {configInfo && (
              <div className="text-xs text-center text-muted-foreground pt-2 border-t">
                <div>{t.common.version} {configInfo.version}</div>
                <div className="font-mono text-[10px]">{configInfo.apiUrl}</div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </AuthShell>
  )
}
