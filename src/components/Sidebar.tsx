'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { CATEGORIES } from '@/lib/categories'

export function Sidebar() {
  const pathname = usePathname()
  const [expandedSlugs, setExpandedSlugs] = useState<Set<string>>(new Set())

  // 路由变化时自动展开对应分类
  useEffect(() => {
    const match = CATEGORIES.find(c =>
      pathname === `/category/${c.slug}` || c.children.some(ch => pathname === `/category/${ch.slug}`)
    )
    if (match) {
      setExpandedSlugs(prev => new Set(prev).add(match.slug))
    }
  }, [pathname])

  function toggle(slug: string) {
    setExpandedSlugs(prev => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  return (
    <aside className="hidden w-64 shrink-0 md:block">
      <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto border-r border-gray-200 bg-white/60 p-4 dark:border-gray-800 dark:bg-gray-900/50">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        知识分类
      </h2>
      <nav className="space-y-0.5">
        {CATEGORIES.map((cat) => {
          const isActive = pathname === `/category/${cat.slug}`
          const isExpanded = expandedSlugs.has(cat.slug)

          return (
            <div key={cat.slug}>
              {/* 整行可点击：导航 + 展开/收起 */}
              <Link
                href={`/category/${cat.slug}`}
                onClick={(e) => {
                  if (cat.children.length > 0) {
                    toggle(cat.slug)
                    // 如果已经在该分类页面，只切换展开，不导航
                    if (isActive) e.preventDefault()
                  }
                }}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                  isActive
                    ? 'bg-zhongyi-100 font-medium text-zhongyi-700 dark:bg-zhongyi-900/30 dark:text-zhongyi-400'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
              >
                <span>{cat.name}</span>
                {cat.children.length > 0 && (
                  <svg
                    className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </Link>
              {isExpanded && cat.children.length > 0 && (
                <div className="ml-3 mt-0.5 space-y-0.5 border-l border-gray-200 pl-3 dark:border-gray-800">
                  {cat.children.map((child) => {
                    const childActive = pathname === `/category/${child.slug}`
                    return (
                      <Link
                        key={child.slug}
                        href={`/category/${child.slug}`}
                        className={`block rounded px-2 py-1.5 text-xs transition ${
                          childActive
                            ? 'bg-zhongyi-100 font-medium text-zhongyi-700 dark:bg-zhongyi-900/30 dark:text-zhongyi-400'
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                        }`}
                      >
                        {child.name}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>
      </div>
    </aside>
  )
}
