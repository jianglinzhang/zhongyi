export default function ArticleLoading() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse px-4 py-8">
      <div className="mb-6 h-4 w-60 rounded bg-gray-200 dark:bg-gray-800" />
      <div className="mb-3 h-9 w-80 rounded bg-gray-200 dark:bg-gray-800" />
      <div className="mb-6 h-20 rounded-lg bg-gray-100 dark:bg-gray-900" />
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i}>
            <div className="mb-2 h-5 w-32 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="space-y-1.5">
              <div className="h-4 w-full rounded bg-gray-100 dark:bg-gray-900" />
              <div className="h-4 w-5/6 rounded bg-gray-100 dark:bg-gray-900" />
              <div className="h-4 w-4/6 rounded bg-gray-100 dark:bg-gray-900" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
