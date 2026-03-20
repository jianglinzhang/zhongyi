'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { KnowledgeGraph } from '@/components/KnowledgeGraph'
import { CATEGORIES } from '@/lib/categories'
import type { GraphData } from '@/types'

export default function GraphPage() {
  const router = useRouter()
  const [data, setData] = useState<GraphData>({ nodes: [], links: [] })
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const url = category ? `/api/graph?category=${category}` : '/api/graph'
    fetch(url)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData({ nodes: [], links: [] }))
      .finally(() => setLoading(false))
  }, [category])

  function handleNodeClick(nodeId: string) {
    const node = data.nodes.find((n) => n.id === nodeId)
    if (node) {
      router.push(`/article/${nodeId}`)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">知识图谱</h1>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900"
        >
          <option value="">全部分类</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.slug} value={cat.slug}>{cat.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex h-96 items-center justify-center">
          <span className="text-gray-500">加载中...</span>
        </div>
      ) : (
        <KnowledgeGraph data={data} onNodeClick={handleNodeClick} />
      )}

      <p className="mt-4 text-center text-sm text-gray-500">
        点击节点查看详情，拖拽节点调整布局
      </p>
    </div>
  )
}
