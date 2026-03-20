import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Header } from '@/components/Header'
import { Sidebar } from '@/components/Sidebar'
import { ThemeProvider } from '@/components/ThemeToggle'
import { PWARegister, InstallPrompt } from '@/components/PWARegister'

export const metadata: Metadata = {
  title: '中医知识库',
  description: '个人中医学习知识库 - 脉诊、方剂、中药、经络、针灸、推拿、养生功法等',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#3f8e61',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem('theme');
                if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen">
        <ThemeProvider>
          <PWARegister />
          <InstallPrompt />
          <Header />
          <div className="flex min-h-[calc(100vh-4rem)]">
            <Sidebar />
            <main className="flex-1 overflow-x-hidden">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
