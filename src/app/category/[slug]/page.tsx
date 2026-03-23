import Link from 'next/link'
import { notFound } from 'next/navigation'
import { store } from '@/lib/store'
import { CATEGORIES } from '@/lib/categories'
import { Pagination } from '@/components/Pagination'

const PAGE_SIZE = 20

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

// 构建时预生成所有分类页面
export function generateStaticParams() {
  const slugs: { slug: string }[] = []
  for (const cat of CATEGORIES) {
    slugs.push({ slug: cat.slug })
    for (const child of cat.children) {
      slugs.push({ slug: child.slug })
    }
  }
  return slugs
}

// 内容变化时自动重新生成（60秒检查一次）
export const revalidate = 60

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr as string) || 1)
  const category = store.getCategory(slug)

  if (!category) {
    const staticCat = CATEGORIES.find((c) => c.slug === slug || c.children.some((ch) => ch.slug === slug))
    if (!staticCat) notFound()

    const isChild = staticCat.children.some((ch) => ch.slug === slug)
    const displayCat = isChild ? staticCat.children.find((ch) => ch.slug === slug)! : staticCat

    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <nav className="mb-6 text-sm text-gray-500">
          <Link href="/" className="hover:text-zhongyi-600">首页</Link>
          {isChild && (
            <>
              <span className="mx-2">/</span>
              <Link href={`/category/${staticCat.slug}`} className="hover:text-zhongyi-600">{staticCat.name}</Link>
            </>
          )}
          <span className="mx-2">/</span>
          <span className="text-gray-900 dark:text-gray-100">{displayCat.name}</span>
        </nav>

        <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-gray-100">{displayCat.name}</h1>

        {!isChild && staticCat.children.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {staticCat.children.map((child) => (
              <Link
                key={child.slug}
                href={`/category/${child.slug}`}
                className="rounded-lg border border-gray-200 p-4 transition hover:border-zhongyi-300 hover:shadow dark:border-gray-800 dark:hover:border-zhongyi-700"
              >
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{child.name}</span>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 rounded-lg border-2 border-dashed border-gray-300 p-6 text-center dark:border-gray-700">
          <p className="text-gray-500">该分类暂无内容，通过API导入后将在此显示</p>
        </div>
      </div>
    )
  }

  const hasChildren = category.children.length > 0

  // 叶子分类：分页加载文章
  let articles: any[] = []
  let totalArticles = 0
  let totalPages = 1

  if (!hasChildren) {
    const result = store.listArticles({
      categorySlug: slug,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    })
    articles = result.articles
    totalArticles = result.total
    totalPages = Math.ceil(totalArticles / PAGE_SIZE)
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:text-zhongyi-600">首页</Link>
        {category.parent && (
          <>
            <span className="mx-2">/</span>
            <Link href={`/category/${category.parent.slug}`} className="hover:text-zhongyi-600">
              {category.parent.name}
            </Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-gray-100">{category.name}</span>
      </nav>

      <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{category.name}</h1>
      {category.description && (
        <p className="mb-6 text-gray-500 dark:text-gray-400">{category.description}</p>
      )}

      {/* 有子分类时只显示子分类，不显示内容列表 */}
      {hasChildren && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">子分类</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {category.children.map((child: any) => (
              <Link
                key={child.slug}
                href={`/category/${child.slug}`}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-3 transition hover:border-zhongyi-300 dark:border-gray-800 dark:hover:border-zhongyi-700"
              >
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{child.name}</span>
                <span className="text-xs text-gray-400">{child._count?.articles || 0}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 叶子分类：分页显示内容列表 */}
      {!hasChildren && articles.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
            内容列表 ({totalArticles})
          </h2>
          <div className="space-y-2">
            {articles.map((article: any) => (
              <Link
                key={article.id}
                href={`/article/${article.slug}`}
                className="block rounded-lg border border-gray-200 bg-white px-4 py-3 transition hover:border-zhongyi-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-zhongyi-700"
              >
                <h3 className="font-medium text-gray-900 dark:text-gray-100">{article.title}</h3>
                {article.summary && (
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{article.summary}</p>
                )}
                {article.tags?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {article.tags.map((tag: string) => (
                      <span key={tag} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} basePath={`/category/${slug}`} />
        </section>
      )}

      {!hasChildren && articles.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center dark:border-gray-700">
          <p className="text-gray-500">该分类暂无内容</p>
        </div>
      )}
    </div>
  )
}
