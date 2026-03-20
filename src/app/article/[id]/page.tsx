import Link from 'next/link'
import { notFound } from 'next/navigation'
import { store } from '@/lib/store'
import { ContentRenderer } from '@/components/ContentRenderer'
import type { ContentBlock } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ArticlePage({ params }: Props) {
  const { id } = await params
  const article = store.getArticle(decodeURIComponent(id))

  if (!article) notFound()

  const relations = [
    ...article.relationsFrom.map((r: any) => r.toArticle),
    ...article.relationsTo.map((r: any) => r.fromArticle),
  ]

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* 面包屑 */}
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:text-zhongyi-600">首页</Link>
        {article.category?.parent && (
          <>
            <span className="mx-2">/</span>
            <Link href={`/category/${article.category.parent.slug}`} className="hover:text-zhongyi-600">
              {article.category.parent.name}
            </Link>
          </>
        )}
        <span className="mx-2">/</span>
        <Link href={`/category/${article.category?.slug}`} className="hover:text-zhongyi-600">
          {article.category?.name}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-gray-100">{article.title}</span>
      </nav>

      {/* 标题 */}
      <h1 className="mb-3 text-3xl font-bold text-gray-900 dark:text-gray-100">{article.title}</h1>

      {/* 摘要 */}
      {article.summary && (
        <p className="mb-6 rounded-lg bg-gray-50 p-4 text-gray-600 dark:bg-gray-900 dark:text-gray-400">
          {article.summary}
        </p>
      )}

      {/* 标签 */}
      {article.tags.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {article.tags.map((tag: string) => (
            <Link
              key={tag}
              href={`/search?tags=${encodeURIComponent(tag)}`}
              className="rounded-full bg-zhongyi-100 px-3 py-1 text-xs text-zhongyi-700 transition hover:bg-zhongyi-200 dark:bg-zhongyi-900/30 dark:text-zhongyi-400"
            >
              {tag}
            </Link>
          ))}
        </div>
      )}

      {/* 正文 */}
      <div className="mb-8">
        <ContentRenderer blocks={article.content as unknown as ContentBlock[]} />
      </div>

      {/* 参考文献 */}
      {article.references.length > 0 && (
        <section className="mb-8 border-t border-gray-200 pt-6 dark:border-gray-800">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">参考文献</h2>
          <ul className="list-inside list-disc space-y-1 text-sm text-gray-600 dark:text-gray-400">
            {article.references.map((ref: string, i: number) => (
              <li key={i}>{ref}</li>
            ))}
          </ul>
        </section>
      )}

      {/* 关联内容 */}
      {relations.length > 0 && (
        <section className="border-t border-gray-200 pt-6 dark:border-gray-800">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">关联内容</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {relations.map((rel: any) => (
              <Link
                key={rel.id}
                href={`/article/${rel.slug}`}
                className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 transition hover:border-zhongyi-300 dark:border-gray-800 dark:hover:border-zhongyi-700"
              >
                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  {rel.category?.name}
                </span>
                <span className="text-sm text-gray-900 dark:text-gray-100">{rel.title}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
