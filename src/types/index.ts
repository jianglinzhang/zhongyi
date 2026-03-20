// ===== 内容块类型 =====

export type ContentBlock =
  | SectionBlock
  | TableBlock
  | QuoteBlock
  | ListBlock
  | ImageBlock
  | FormulaBlock

export interface SectionBlock {
  type: 'section'
  heading: string
  body: string
}

export interface TableBlock {
  type: 'table'
  heading?: string
  headers: string[]
  rows: string[][]
}

export interface QuoteBlock {
  type: 'quote'
  source: string
  body: string
}

export interface ListBlock {
  type: 'list'
  heading?: string
  items: string[]
  ordered?: boolean
}

export interface ImageBlock {
  type: 'image'
  url: string
  caption?: string
}

export interface FormulaBlock {
  type: 'formula'
  heading?: string
  herbs: { name: string; amount: string; role?: string }[]
  preparation?: string
  usage?: string
}

// ===== API 请求类型 =====

export interface CreateArticleRequest {
  title: string
  slug?: string
  categorySlug: string
  summary?: string
  content: ContentBlock[]
  tags?: string[]
  references?: string[]
  images?: string[]
  relations?: string[]
  sortOrder?: number
}

export interface ImportRequest {
  articles: CreateArticleRequest[]
  format?: 'json' | 'markdown'
}

export interface SearchParams {
  q?: string
  category?: string
  tags?: string
  page?: number
  pageSize?: number
}

// ===== 图谱数据 =====

export interface GraphNode {
  id: string
  name: string
  category: string
  categoryName: string
  val?: number
}

export interface GraphLink {
  source: string
  target: string
  type: string
}

export interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}
