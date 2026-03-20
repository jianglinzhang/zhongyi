'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CATEGORIES } from '@/lib/categories'

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [expandedSlugs, setExpandedSlugs] = useState<Set<string>>(new Set())
  const pathname = usePathname()

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { setOpen(false) }, [pathname])
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  function toggleExpand(slug: string) {
    setExpandedSlugs(prev => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  // 用 portal 渲染到 body，避免 Header 的 backdrop-blur 创建包含块
  const panel = mounted ? createPortal(
    <>
      {/* 遮罩 */}
      <div
        className={`fixed inset-0 z-[200] bg-black/40 transition-opacity duration-300 md:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setOpen(false)}
      />
      {/* 导航面板 */}
      <nav
        style={{ willChange: 'transform' }}
        className={`fixed left-0 top-0 z-[200] flex h-full w-[280px] max-w-[85vw] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out dark:bg-gray-950 md:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-zhongyi-100 px-4 py-4 dark:border-gray-800">
          <Link href="/" onClick={() => setOpen(false)} className="text-lg font-bold text-zhongyi-700 dark:text-zhongyi-400">
            中医知识库
          </Link>
          <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3">
          <p className="mb-2 px-2 text-xs font-medium tracking-wider text-gray-400">知识分类</p>
          <div className="space-y-0.5">
            {CATEGORIES.map(cat => {
              const isActive = pathname.startsWith(`/category/${cat.slug}`)
              const isExpanded = expandedSlugs.has(cat.slug)
              return (
                <div key={cat.slug}>
                  <Link
                    href={`/category/${cat.slug}`}
                    onClick={() => { if (cat.children.length > 0) toggleExpand(cat.slug); setOpen(false) }}
                    className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      isActive
                        ? 'bg-zhongyi-50 font-medium text-zhongyi-700 dark:bg-zhongyi-900/30 dark:text-zhongyi-400'
                        : 'text-gray-700 active:bg-gray-100 dark:text-gray-300'
                    }`}
                  >
                    <span>{cat.name}</span>
                    {cat.children.length > 0 && (
                      <svg className={`h-3.5 w-3.5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </Link>
                  {isExpanded && cat.children.length > 0 && (
                    <div className="ml-3 mt-0.5 space-y-0.5 border-l-2 border-zhongyi-100 pl-3 dark:border-gray-800">
                      {cat.children.map(child => (
                        <Link
                          key={child.slug}
                          href={`/category/${child.slug}`}
                          onClick={() => setOpen(false)}
                          className={`block rounded-lg px-2.5 py-2 text-xs transition-colors ${
                            pathname === `/category/${child.slug}`
                              ? 'bg-zhongyi-50 font-medium text-zhongyi-700 dark:bg-zhongyi-900/30 dark:text-zhongyi-400'
                              : 'text-gray-500 active:bg-gray-50 dark:text-gray-400'
                          }`}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="border-t border-gray-100 px-3 py-3 dark:border-gray-800">
          <Link href="/graph" onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-gray-600 active:bg-gray-50 dark:text-gray-400">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            知识图谱
          </Link>
        </div>
      </nav>
    </>,
    document.body
  ) : null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg p-2 text-gray-600 hover:bg-zhongyi-50 active:bg-zhongyi-100 dark:text-gray-400 dark:hover:bg-gray-800 md:hidden"
        aria-label="打开导航菜单"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      {panel}
    </>
  )
}
