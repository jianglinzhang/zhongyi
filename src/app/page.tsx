import Link from 'next/link'
import { CATEGORIES } from '@/lib/categories'
import { store } from '@/lib/store'

export const revalidate = 60

export default async function HomePage() {
  const articleCount = store.articleCount()
  const categoryCount = store.categoryCount()
  const recentArticles = store.getRecentArticles(10)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* 标题区 */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
          中医知识库
        </h1>
        <p className="mt-3 text-lg text-gray-500 dark:text-gray-400">
          个人中医学习笔记与知识整理
        </p>
        <div className="mt-4 flex justify-center gap-6 text-sm text-gray-500">
          <span>{categoryCount} 个分类</span>
          <span>{articleCount} 篇内容</span>
        </div>
      </div>

      {/* 分类网格 */}
      <section className="mb-12">
        <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-gray-100">知识分类</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="group rounded-xl border border-gray-200 bg-white p-4 transition hover:border-zhongyi-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-zhongyi-700"
            >
              <h3 className="font-medium text-gray-900 group-hover:text-zhongyi-600 dark:text-gray-100 dark:group-hover:text-zhongyi-400">
                {cat.name}
              </h3>
              <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                {cat.description}
              </p>
              <span className="mt-2 inline-block text-xs text-gray-400">
                {cat.children.length} 个子分类
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 最近添加 */}
      {recentArticles.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">最近添加</h2>
          <div className="space-y-2">
            {recentArticles.map((article) => (
              <Link
                key={article.id}
                href={`/article/${article.slug}`}
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 transition hover:border-zhongyi-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-zhongyi-700"
              >
                <span className="shrink-0 rounded bg-zhongyi-100 px-2 py-0.5 text-xs text-zhongyi-700 dark:bg-zhongyi-900/30 dark:text-zhongyi-400">
                  {article.category?.name}
                </span>
                <span className="flex-1 truncate text-sm text-gray-900 dark:text-gray-100">
                  {article.title}
                </span>
                <span className="shrink-0 text-xs text-gray-400">
                  {article.createdAt.toLocaleDateString('zh-CN')}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 空状态提示 */}
      {articleCount === 0 && (
        <div className="mt-8 rounded-xl border-2 border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">
            知识库还是空的，通过 API 接口导入内容开始学习之旅
          </p>
          <p className="mt-2 text-sm text-gray-400">
            参考项目根目录的 <code className="rounded bg-gray-100 px-1.5 py-0.5 dark:bg-gray-800">API_DOCS.md</code> 了解接口说明
          </p>
        </div>
      )}
    </div>
  )
}
