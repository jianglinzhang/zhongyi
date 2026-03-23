import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { store } from '@/lib/store'
import { checkAuth } from '@/lib/auth'
import type { ContentBlock, CreateArticleRequest } from '@/types'

function extractSearchText(title: string, summary: string | undefined, content: ContentBlock[], tags: string[]): string {
  const contentText = content
    .map((block) => {
      switch (block.type) {
        case 'section': return `${block.heading} ${block.body}`
        case 'table': return `${block.heading || ''} ${block.headers.join(' ')} ${block.rows.map((r) => r.join(' ')).join(' ')}`
        case 'quote': return `${block.source} ${block.body}`
        case 'list': return `${block.heading || ''} ${block.items.join(' ')}`
        case 'formula': return `${block.heading || ''} ${block.herbs.map((h) => h.name).join(' ')}`
        default: return ''
      }
    })
    .join(' ')
  return `${title} ${summary || ''} ${contentText} ${tags.join(' ')}`
}

function parseMarkdown(markdown: string): CreateArticleRequest {
  const lines = markdown.split('\n')
  const content: ContentBlock[] = []
  let title = ''
  let currentSection: { heading: string; body: string[] } | null = null

  for (const line of lines) {
    if (line.startsWith('# ') && !title) {
      title = line.slice(2).trim()
    } else if (line.startsWith('## ')) {
      if (currentSection) {
        content.push({ type: 'section', heading: currentSection.heading, body: currentSection.body.join('\n').trim() })
      }
      currentSection = { heading: line.slice(3).trim(), body: [] }
    } else if (line.startsWith('> ')) {
      content.push({ type: 'quote', source: '', body: line.slice(2).trim() })
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const lastBlock = content[content.length - 1]
      if (lastBlock && lastBlock.type === 'list') {
        lastBlock.items.push(line.slice(2).trim())
      } else {
        if (currentSection) {
          content.push({ type: 'section', heading: currentSection.heading, body: currentSection.body.join('\n').trim() })
          currentSection = null
        }
        content.push({ type: 'list', items: [line.slice(2).trim()] })
      }
    } else if (currentSection) {
      currentSection.body.push(line)
    }
  }

  if (currentSection) {
    content.push({ type: 'section', heading: currentSection.heading, body: currentSection.body.join('\n').trim() })
  }

  return { title: title || '未命名', categorySlug: '', content }
}

export async function POST(req: NextRequest) {
  const authError = checkAuth(req)
  if (authError) return authError

  try {
    const body = await req.json()
    const { articles, format = 'json' }: { articles: (CreateArticleRequest | string)[]; format?: string } = body

    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return NextResponse.json({ error: '请提供articles数组' }, { status: 400 })
    }

    const results: { success: string[]; errors: { index: number; error: string }[] } = { success: [], errors: [] }

    for (let i = 0; i < articles.length; i++) {
      try {
        let article: CreateArticleRequest
        if (format === 'markdown' && typeof articles[i] === 'string') {
          article = parseMarkdown(articles[i] as string)
        } else {
          article = articles[i] as CreateArticleRequest
        }

        if (!article.title || !article.categorySlug || !article.content) {
          results.errors.push({ index: i, error: '缺少必填字段' })
          continue
        }

        const slug = article.slug || `${article.categorySlug}-${Date.now()}-${i}`
        const searchText = extractSearchText(article.title, article.summary, article.content, article.tags || [])

        const created = store.upsertArticle(slug, {
          title: article.title,
          categorySlug: article.categorySlug,
          summary: article.summary || null,
          content: article.content,
          tags: article.tags || [],
          references: article.references || [],
          images: article.images || [],
          searchText,
          sortOrder: article.sortOrder || 0,
        })

        if (article.relations && article.relations.length > 0) {
          const relatedArticles = store.findArticlesBySlugs(article.relations)
          for (const related of relatedArticles) {
            store.upsertRelation(created.id, related.id, 'related')
          }
        }

        results.success.push(slug)
      } catch (error: unknown) {
        results.errors.push({ index: i, error: error instanceof Error ? error.message : '未知错误' })
      }
    }

    // 立即刷新缓存页面
    if (results.success.length > 0) {
      revalidatePath('/', 'layout')
    }

    return NextResponse.json({
      message: `导入完成：${results.success.length} 成功，${results.errors.length} 失败`,
      ...results,
    })
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '导入失败' }, { status: 500 })
  }
}
