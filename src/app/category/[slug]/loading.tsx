export default function CategoryLoading() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse px-4 py-8">
      <div className="mb-6 h-4 w-40 rounded bg-gray-200 dark:bg-gray-800" />
      <div className="mb-2 h-8 w-48 rounded bg-gray-200 dark:bg-gray-800" />
      <div className="mb-6 h-4 w-96 rounded bg-gray-200 dark:bg-gray-800" />

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900" />
        ))}
      </div>

      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900" />
        ))}
      </div>
    </div>
  )
}
