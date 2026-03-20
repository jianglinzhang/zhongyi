import { NextRequest, NextResponse } from 'next/server'
import { store } from '@/lib/store'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''
  const category = searchParams.get('category')
  const tagsParam = searchParams.get('tags')
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')

  if (!q && !category && !tagsParam) {
    return NextResponse.json({ error: '请提供搜索条件：q（关键词）、category（分类）、tags（标签）' }, { status: 400 })
  }

  const result = store.searchArticles(
    q || undefined,
    category || undefined,
    tagsParam || undefined,
    page,
    pageSize,
  )

  return NextResponse.json({ articles: result.articles, total: result.total, page, pageSize, totalPages: result.totalPages })
}
