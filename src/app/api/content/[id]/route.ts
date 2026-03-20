import { NextRequest, NextResponse } from 'next/server'
import { store } from '@/lib/store'
import { checkAuth } from '@/lib/auth'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const article = store.getArticle(id)

  if (!article) {
    return NextResponse.json({ error: '文章不存在' }, { status: 404 })
  }

  const relations = [
    ...article.relationsFrom.map((r: any) => ({ ...r.toArticle, relationType: r.relationType })),
    ...article.relationsTo.map((r: any) => ({ ...r.fromArticle, relationType: r.relationType })),
  ]

  return NextResponse.json({ ...article, relationsFrom: undefined, relationsTo: undefined, relations })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = checkAuth(req)
  if (authError) return authError

  const { id } = await params
  const body = await req.json()

  try {
    const article = store.updateArticle(id, body)
    return NextResponse.json(article)
  } catch {
    return NextResponse.json({ error: '文章不存在或更新失败' }, { status: 404 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = checkAuth(req)
  if (authError) return authError

  const { id } = await params
  const success = store.deleteArticle(id)
  if (!success) {
    return NextResponse.json({ error: '文章不存在' }, { status: 404 })
  }
  return NextResponse.json({ success: true })
}
