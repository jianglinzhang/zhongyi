'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { GraphData } from '@/types'

interface Props {
  data: GraphData
  onNodeClick?: (nodeId: string) => void
}

interface SimNode {
  id: string
  name: string
  category: string
  categoryName: string
  x: number
  y: number
  vx: number
  vy: number
}

const CATEGORY_COLORS: Record<string, string> = {
  jichu: '#ef4444', zhenduan: '#f97316', zhongyao: '#22c55e', fangji: '#3b82f6',
  jingluo: '#8b5cf6', zhenjiu: '#ec4899', tuina: '#14b8a6', baguan: '#f59e0b',
  guasha: '#6366f1', shiliao: '#10b981', gongfa: '#06b6d4', dianji: '#a855f7',
  linchuang: '#e11d48', tizhi: '#0ea5e9', mingyi: '#d946ef', waizhi: '#84cc16',
  minjian: '#f43f5e', jiehe: '#64748b',
}

function getCategoryColor(slug: string): string {
  const parent = slug.split('-')[0]
  return CATEGORY_COLORS[parent] || CATEGORY_COLORS[slug] || '#6b7280'
}

export function KnowledgeGraph({ data, onNodeClick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nodesRef = useRef<SimNode[]>([])
  const animRef = useRef<number>(0)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const dragRef = useRef<{ node: SimNode | null; offsetX: number; offsetY: number }>({ node: null, offsetX: 0, offsetY: 0 })

  const getNodeAt = useCallback((mx: number, my: number): SimNode | null => {
    for (const node of nodesRef.current) {
      const dx = mx - node.x
      const dy = my - node.y
      if (dx * dx + dy * dy < 256) return node
    }
    return null
  }, [])

  useEffect(() => {
    if (!data.nodes.length) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctxOrNull = canvas.getContext('2d')
    if (!ctxOrNull) return
    const ctx = ctxOrNull

    const w = canvas.offsetWidth
    const h = canvas.offsetHeight
    canvas.width = w * 2
    canvas.height = h * 2
    ctx.scale(2, 2)

    const nodes: SimNode[] = data.nodes.map((n, i) => ({
      ...n,
      x: w / 2 + (Math.random() - 0.5) * w * 0.6,
      y: h / 2 + (Math.random() - 0.5) * h * 0.6,
      vx: 0, vy: 0,
    }))
    nodesRef.current = nodes

    const nodeMap = new Map(nodes.map((n) => [n.id, n]))
    const links = data.links
      .map((l) => ({ source: nodeMap.get(l.source as string), target: nodeMap.get(l.target as string) }))
      .filter((l) => l.source && l.target) as { source: SimNode; target: SimNode }[]

    function tick() {
      // 力导向模拟
      for (const node of nodes) {
        node.vx *= 0.9
        node.vy *= 0.9
        // 向中心的引力
        node.vx += (w / 2 - node.x) * 0.001
        node.vy += (h / 2 - node.y) * 0.001
      }
      // 节点间排斥
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x
          const dy = nodes[j].y - nodes[i].y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const force = 800 / (dist * dist)
          nodes[i].vx -= (dx / dist) * force
          nodes[i].vy -= (dy / dist) * force
          nodes[j].vx += (dx / dist) * force
          nodes[j].vy += (dy / dist) * force
        }
      }
      // 连接弹簧力
      for (const link of links) {
        const dx = link.target.x - link.source.x
        const dy = link.target.y - link.source.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const force = (dist - 120) * 0.01
        link.source.vx += (dx / dist) * force
        link.source.vy += (dy / dist) * force
        link.target.vx -= (dx / dist) * force
        link.target.vy -= (dy / dist) * force
      }
      // 更新位置
      for (const node of nodes) {
        if (dragRef.current.node === node) continue
        node.x += node.vx
        node.y += node.vy
        node.x = Math.max(20, Math.min(w - 20, node.x))
        node.y = Math.max(20, Math.min(h - 20, node.y))
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h)

      // 画连线
      ctx.strokeStyle = document.documentElement.classList.contains('dark') ? '#374151' : '#d1d5db'
      ctx.lineWidth = 1
      for (const link of links) {
        ctx.beginPath()
        ctx.moveTo(link.source.x, link.source.y)
        ctx.lineTo(link.target.x, link.target.y)
        ctx.stroke()
      }

      // 画节点
      for (const node of nodes) {
        const isHovered = hoveredNode === node.id
        const radius = isHovered ? 10 : 7
        ctx.beginPath()
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2)
        ctx.fillStyle = getCategoryColor(node.category)
        ctx.fill()
        if (isHovered) {
          ctx.strokeStyle = '#fff'
          ctx.lineWidth = 2
          ctx.stroke()
        }

        // 标签
        ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151'
        ctx.font = isHovered ? 'bold 12px sans-serif' : '10px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(node.name, node.x, node.y + radius + 14)
      }

      tick()
      animRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => cancelAnimationFrame(animRef.current)
  }, [data, hoveredNode])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function handleMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      if (dragRef.current.node) {
        dragRef.current.node.x = mx
        dragRef.current.node.y = my
        return
      }
      const node = getNodeAt(mx, my)
      setHoveredNode(node?.id || null)
      canvas!.style.cursor = node ? 'pointer' : 'default'
    }

    function handleMouseDown(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect()
      const node = getNodeAt(e.clientX - rect.left, e.clientY - rect.top)
      if (node) dragRef.current = { node, offsetX: 0, offsetY: 0 }
    }

    function handleMouseUp(e: MouseEvent) {
      if (dragRef.current.node) {
        const rect = canvas!.getBoundingClientRect()
        const node = getNodeAt(e.clientX - rect.left, e.clientY - rect.top)
        if (node && onNodeClick) onNodeClick(node.id)
      }
      dragRef.current = { node: null, offsetX: 0, offsetY: 0 }
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mouseup', handleMouseUp)
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mouseup', handleMouseUp)
    }
  }, [getNodeAt, onNodeClick])

  if (!data.nodes.length) {
    return (
      <div className="flex h-96 items-center justify-center text-gray-500">
        暂无数据，导入内容后将在此展示知识图谱
      </div>
    )
  }

  return <canvas ref={canvasRef} className="h-[600px] w-full rounded-lg border border-gray-200 dark:border-gray-800" />
}
