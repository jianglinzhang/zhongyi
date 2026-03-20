'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ThemeToggle } from './ThemeToggle'
import { MobileNav } from './MobileNav'

export function Header() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <MobileNav />

        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="text-2xl">&#x2F69A;</span>
          <span className="hidden text-xl font-bold text-zhongyi-700 dark:text-zhongyi-400 sm:block">
            中医知识库
          </span>
        </Link>

        <form onSubmit={handleSearch} className="relative mx-4 flex max-w-md flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索知识..."
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 pr-10 text-sm outline-none transition focus:border-zhongyi-500 focus:ring-2 focus:ring-zhongyi-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-zhongyi-600"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </form>

        <nav className="hidden items-center gap-4 md:flex">
          <Link href="/graph" className="text-sm text-gray-600 hover:text-zhongyi-600 dark:text-gray-400 dark:hover:text-zhongyi-400">
            知识图谱
          </Link>
        </nav>

        <ThemeToggle />
      </div>
    </header>
  )
}
