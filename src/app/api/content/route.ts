import { NextRequest, NextResponse } from 'next/server'
import { store } from '@/lib/store'
import { checkAuth } from '@/lib/auth'
import type { ContentBlock } from '@/types'

function extractSearchText(content: ContentBlock[]): string {
  return content
    .map((block) => {
      switch (block.type) {
        case 'section':
          return `${block.heading} ${block.body}`
        case 'table':
          return `${block.heading || ''} ${block.headers.join(' ')} ${block.rows.map((r) => r.join(' ')).join(' ')}`
        case 'quote':
          return `${block.source} ${block.body}`
        case 'list':
          return `${block.heading || ''} ${block.items.join(' ')}`
        case 'image':
          return block.caption || ''
        case 'formula':
          return `${block.heading || ''} ${block.herbs.map((h) => `${h.name} ${h.amount} ${h.role || ''}`).join(' ')} ${block.preparation || ''} ${block.usage || ''}`
        default:
          return ''
      }
    })
    .join(' ')
}

export async function POST(req: NextRequest) {
  const authError = checkAuth(req)
  if (authError) return authError

  try {
    const body = await req.json()
    const { title, slug, categorySlug, summary, content, tags, references, images, relations, sortOrder } = body

    if (!title || !categorySlug || !content) {
      return NextResponse.json({ error: '缺少必填字段：title, categorySlug, content' }, { status: 400 })
    }

    const category = store.getCategory(categorySlug)
    if (!category) {
      return NextResponse.json({ error: `分类不存在：${categorySlug}` }, { status: 400 })
    }

    const articleSlug = slug || `${categorySlug}-${Date.now()}`
    const searchText = `${title} ${summary || ''} ${extractSearchText(content)} ${(tags || []).join(' ')}`

    const article = store.createArticle({
      title, slug: articleSlug, categorySlug,
      summary: summary || null, content,
      tags: tags || [], references: references || [], images: images || [],
      searchText, sortOrder: sortOrder || 0,
    })

    if (relations && relations.length > 0) {
      const relatedArticles = store.findArticlesBySlugs(relations)
      for (const related of relatedArticles) {
        store.upsertRelation(article.id, related.id, 'related')
      }
    }

    return NextResponse.json(article, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '未知错误'
    if (message.includes('Unique constraint') || message.includes('slug已存在')) {
      return NextResponse.json({ error: 'slug已存在，请使用不同的slug' }, { status: 409 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')

  const result = store.listArticles({
    categorySlug: category || undefined,
    skip: (page - 1) * pageSize,
    take: pageSize,
  })

  return NextResponse.json({ articles: result.articles, total: result.total, page, pageSize, totalPages: Math.ceil(result.total / pageSize) })
}
