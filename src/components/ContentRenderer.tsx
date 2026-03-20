import type { ContentBlock } from '@/types'

export function ContentRenderer({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="space-y-6">
      {blocks.map((block, i) => (
        <ContentBlock key={i} block={block} />
      ))}
    </div>
  )
}

function ContentBlock({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'section':
      return (
        <section>
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">{block.heading}</h3>
          <div className="whitespace-pre-line text-gray-700 dark:text-gray-300">{block.body}</div>
        </section>
      )

    case 'table':
      return (
        <section>
          {block.heading && <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">{block.heading}</h3>}
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-300 dark:border-gray-700">
                  {block.headers.map((h, i) => (
                    <th key={i} className="px-3 py-2 text-left font-medium text-gray-900 dark:text-gray-100">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, i) => (
                  <tr key={i} className="border-b border-gray-200 dark:border-gray-800">
                    {row.map((cell, j) => (
                      <td key={j} className="px-3 py-2 text-gray-700 dark:text-gray-300">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )

    case 'quote':
      return (
        <blockquote className="border-l-4 border-zhongyi-400 bg-zhongyi-50/50 py-3 pl-4 pr-3 dark:border-zhongyi-700 dark:bg-zhongyi-950/30">
          <p className="italic text-gray-700 dark:text-gray-300">{block.body}</p>
          {block.source && <cite className="mt-1 block text-sm text-gray-500">—— {block.source}</cite>}
        </blockquote>
      )

    case 'list':
      return (
        <section>
          {block.heading && <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">{block.heading}</h3>}
          {block.ordered ? (
            <ol className="list-inside list-decimal space-y-1 text-gray-700 dark:text-gray-300">
              {block.items.map((item, i) => <li key={i}>{item}</li>)}
            </ol>
          ) : (
            <ul className="list-inside list-disc space-y-1 text-gray-700 dark:text-gray-300">
              {block.items.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          )}
        </section>
      )

    case 'image':
      return (
        <figure className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.url} alt={block.caption || ''} className="mx-auto max-w-full rounded-lg" />
          {block.caption && <figcaption className="mt-2 text-sm text-gray-500">{block.caption}</figcaption>}
        </figure>
      )

    case 'formula':
      return (
        <section className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
          {block.heading && <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">{block.heading}</h3>}
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {block.herbs.map((herb, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm dark:bg-amber-900/50">
                  <span className="font-medium">{herb.name}</span>
                  <span className="text-gray-500 dark:text-gray-400">{herb.amount}</span>
                  {herb.role && <span className="text-xs text-amber-600 dark:text-amber-400">({herb.role})</span>}
                </span>
              ))}
            </div>
            {block.preparation && <p className="text-sm text-gray-600 dark:text-gray-400"><span className="font-medium">制法：</span>{block.preparation}</p>}
            {block.usage && <p className="text-sm text-gray-600 dark:text-gray-400"><span className="font-medium">用法：</span>{block.usage}</p>}
          </div>
        </section>
      )

    default:
      return null
  }
}
