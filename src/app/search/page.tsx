import Link from 'next/link'
import { store } from '@/lib/store'
import { CATEGORIES } from '@/lib/categories'

interface Props {
  searchParams: Promise<{ q?: string; category?: string; tags?: string; page?: string }>
}

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams
  const q = sp.q || ''
  const category = sp.category || ''
  const tags = sp.tags || ''
  const page = parseInt(sp.page || '1')

  const hasQuery = q || category || tags
  const result = hasQuery ? store.searchArticles(q || undefined, category || undefined, tags || undefined, page) : null

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">搜索</h1>

      <form className="mb-6 space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="输入关键词搜索..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-zhongyi-500 focus:ring-2 focus:ring-zhongyi-500/20 dark:border-gray-700 dark:bg-gray-900"
          />
          <button
            type="submit"
            className="rounded-lg bg-zhongyi-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-zhongyi-700"
          >
            搜索
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            name="category"
            defaultValue={category}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="">全部分类</option>
            {CATEGORIES.map((cat) => (
              <optgroup key={cat.slug} label={cat.name}>
                {cat.children.map((child) => (
                  <option key={child.slug} value={child.slug}>{child.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <input
            type="text"
            name="tags"
            defaultValue={tags}
            placeholder="标签筛选（逗号分隔）"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
        </div>
      </form>

      {result && (
        <>
          <p className="mb-4 text-sm text-gray-500">
            找到 {result.total} 条结果
            {q && <span>（关键词：{q}）</span>}
          </p>

          {result.articles.length > 0 ? (
            <div className="space-y-2">
              {result.articles.map((article: any) => (
                <Link
                  key={article.id}
                  href={`/article/${article.slug}`}
                  className="block rounded-lg border border-gray-200 bg-white px-4 py-3 transition hover:border-zhongyi-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-zhongyi-700"
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-zhongyi-100 px-2 py-0.5 text-xs text-zhongyi-700 dark:bg-zhongyi-900/30 dark:text-zhongyi-400">
                      {article.category?.name}
                    </span>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">{article.title}</h3>
                  </div>
                  {article.summary && (
                    <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{article.summary}</p>
                  )}
                  {article.tags?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {article.tags.map((tag: string) => (
                        <span key={tag} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
              <p className="text-gray-500">没有找到匹配的内容</p>
            </div>
          )}
        </>
      )}

      {!hasQuery && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
          <p className="text-gray-500">输入关键词或选择筛选条件开始搜索</p>
        </div>
      )}
    </div>
  )
}
