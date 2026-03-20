'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWARegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])
  return null
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // 检查是否已经安装或之前关闭过
    if (window.matchMedia('(display-mode: standalone)').matches) return
    if (sessionStorage.getItem('pwa-dismissed')) return

    function handler(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
    }
    setDismissed(true)
  }

  function handleDismiss() {
    setDismissed(true)
    sessionStorage.setItem('pwa-dismissed', '1')
  }

  if (!deferredPrompt || dismissed) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] mx-auto max-w-sm animate-[slideUp_0.3s_ease-out] rounded-xl border border-zhongyi-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-900 md:hidden">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zhongyi-100 text-lg dark:bg-zhongyi-900/30">
          🌿
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">安装到桌面</p>
          <p className="mt-0.5 text-xs text-gray-500">添加到主屏幕，随时查阅中医知识</p>
        </div>
        <button onClick={handleDismiss} className="shrink-0 p-1 text-gray-400">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <button
        onClick={handleInstall}
        className="mt-3 w-full rounded-lg bg-zhongyi-600 px-4 py-2 text-sm font-medium text-white hover:bg-zhongyi-700 active:bg-zhongyi-800"
      >
        立即安装
      </button>
    </div>
  )
}
