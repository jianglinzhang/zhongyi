import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'fs'
import path from 'path'
import { CATEGORIES } from './categories'
import { INITIAL_ARTICLES, INITIAL_RELATIONS } from './initial-content'

// ===== 配置 =====
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data')
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json')
const ARTICLES_FILE = path.join(DATA_DIR, 'articles.json')
const RELATIONS_FILE = path.join(DATA_DIR, 'relations.json')

// ===== 类型 =====
export interface StoreCategory {
  id: string; slug: string; name: string; description: string | null
  icon: string | null; parentSlug: string | null; sortOrder: number
  createdAt: string; updatedAt: string
}
export interface StoreArticle {
  id: string; slug: string; title: string; categorySlug: string
  summary: string | null; content: unknown; tags: string[]
  references: string[]; images: string[]; searchText: string | null
  sortOrder: number; createdAt: string; updatedAt: string
}
export interface StoreRelation {
  id: string; fromArticleId: string; toArticleId: string; relationType: string
}

// 带 Date 对象的版本（给页面用，兼容 .toLocaleDateString）
function withDates<T extends { createdAt: string; updatedAt: string }>(item: T): T & { createdAt: Date; updatedAt: Date } {
  return { ...item, createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt) }
}

// ===== 文件 I/O =====
function ensureDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
}
function readJson<T>(file: string, fallback: T): T {
  try { return existsSync(file) ? JSON.parse(readFileSync(file, 'utf-8')) : fallback } catch { return fallback }
}
function writeJson(file: string, data: unknown) {
  ensureDir()
  writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8')
}
function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

// ===== 缓存（进程级单例 + 文件修改检测） =====
const g = globalThis as unknown as {
  _storeCats: StoreCategory[] | null
  _storeArts: StoreArticle[] | null
  _storeRels: StoreRelation[] | null
  _storeMtimes: Record<string, number>
}
if (!g._storeMtimes) g._storeMtimes = {}

function getFileMtime(file: string): number {
  try { return existsSync(file) ? statSync(file).mtimeMs : 0 } catch { return 0 }
}

function isCacheStale(file: string): boolean {
  const current = getFileMtime(file)
  if (current !== g._storeMtimes[file]) {
    g._storeMtimes[file] = current
    return true
  }
  return false
}

function loadCategories(): StoreCategory[] {
  if (g._storeCats && !isCacheStale(CATEGORIES_FILE)) return g._storeCats
  const raw = readJson<StoreCategory[]>(CATEGORIES_FILE, [])
  if (raw.length > 0) { g._storeCats = raw; return raw }
  // 首次运行：从 CATEGORIES 常量初始化
  const now = new Date().toISOString()
  const cats: StoreCategory[] = []
  CATEGORIES.forEach((cat, i) => {
    cats.push({ id: genId(), slug: cat.slug, name: cat.name, description: cat.description, icon: cat.icon, parentSlug: null, sortOrder: i, createdAt: now, updatedAt: now })
    cat.children.forEach((ch, j) => {
      cats.push({ id: genId(), slug: ch.slug, name: ch.name, description: ch.description || null, icon: cat.icon, parentSlug: cat.slug, sortOrder: j, createdAt: now, updatedAt: now })
    })
  })
  writeJson(CATEGORIES_FILE, cats)
  g._storeCats = cats
  return cats
}
function loadArticles(): StoreArticle[] {
  if (g._storeArts && !isCacheStale(ARTICLES_FILE)) return g._storeArts
  const raw = readJson<StoreArticle[]>(ARTICLES_FILE, [])
  if (raw.length > 0) { g._storeArts = raw; ensureStartupSync(); return raw }
  // 首次运行：填充基础理论内容
  const now = new Date().toISOString()
  const arts: StoreArticle[] = INITIAL_ARTICLES.map(a => {
    const searchText = `${a.title} ${a.summary} ${(a.content as any[]).map((b: any) => b.heading || b.body || (b.items || []).join(' ') || '').join(' ')} ${a.tags.join(' ')}`
    return { id: genId(), slug: a.slug, title: a.title, categorySlug: a.categorySlug, summary: a.summary, content: a.content, tags: a.tags, references: a.references, images: [], searchText, sortOrder: a.sortOrder, createdAt: now, updatedAt: now }
  })
  writeJson(ARTICLES_FILE, arts)
  // 填充关联
  const rels: StoreRelation[] = []
  for (const [fromSlug, toSlug] of INITIAL_RELATIONS) {
    const from = arts.find(a => a.slug === fromSlug)
    const to = arts.find(a => a.slug === toSlug)
    if (from && to) rels.push({ id: genId(), fromArticleId: from.id, toArticleId: to.id, relationType: 'related' })
  }
  if (rels.length > 0) writeJson(RELATIONS_FILE, rels)
  g._storeRels = rels
  g._storeArts = arts
  ensureStartupSync()
  return arts
}
function loadRelations(): StoreRelation[] {
  if (g._storeRels && !isCacheStale(RELATIONS_FILE)) return g._storeRels
  g._storeRels = readJson<StoreRelation[]>(RELATIONS_FILE, [])
  return g._storeRels
}
function saveCats(cats: StoreCategory[]) { g._storeCats = cats; writeJson(CATEGORIES_FILE, cats); scheduleSync() }
function saveArts(arts: StoreArticle[]) { g._storeArts = arts; writeJson(ARTICLES_FILE, arts); scheduleSync() }
function saveRels(rels: StoreRelation[]) { g._storeRels = rels; writeJson(RELATIONS_FILE, rels); scheduleSync() }

// ===== 同步调度 =====
let syncTimer: ReturnType<typeof setTimeout> | null = null
let startupSynced = false

function scheduleSync() {
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(() => {
    import('./sync').then(m => m.performSync()).catch(() => {})
  }, 3000)
}

// 启动时首次同步（应用加载后自动将本地数据推送到 DB/S3）
function ensureStartupSync() {
  if (startupSynced) return
  startupSynced = true
  // 延迟 5 秒执行，让应用先完成启动
  setTimeout(() => {
    import('./sync').then(m => m.performSync()).catch(() => {})
  }, 5000)
}

// ===== 辅助：给文章附加分类信息 =====
function attachCategory(art: StoreArticle) {
  const cats = loadCategories()
  const cat = cats.find(c => c.slug === art.categorySlug)
  return { ...withDates(art), category: cat ? withDates(cat) : null }
}

function attachCategoryFull(art: StoreArticle) {
  const cats = loadCategories()
  const cat = cats.find(c => c.slug === art.categorySlug)
  const parent = cat?.parentSlug ? cats.find(c => c.slug === cat.parentSlug) || null : null
  const rels = loadRelations()
  const arts = loadArticles()

  const relFrom = rels.filter(r => r.fromArticleId === art.id).map(r => {
    const to = arts.find(a => a.id === r.toArticleId)
    if (!to) return null
    const toCat = cats.find(c => c.slug === to.categorySlug)
    return { toArticle: { id: to.id, title: to.title, slug: to.slug, categorySlug: to.categorySlug, category: { name: toCat?.name || '' } }, relationType: r.relationType }
  }).filter(Boolean)

  const relTo = rels.filter(r => r.toArticleId === art.id).map(r => {
    const from = arts.find(a => a.id === r.fromArticleId)
    if (!from) return null
    const fromCat = cats.find(c => c.slug === from.categorySlug)
    return { fromArticle: { id: from.id, title: from.title, slug: from.slug, categorySlug: from.categorySlug, category: { name: fromCat?.name || '' } }, relationType: r.relationType }
  }).filter(Boolean)

  return {
    ...withDates(art),
    category: cat ? { ...withDates(cat), parent: parent ? withDates(parent) : null } : null,
    relationsFrom: relFrom,
    relationsTo: relTo,
  }
}

// ===== 模糊匹配（替代 PostgreSQL ILIKE） =====
function ilike(text: string | null | undefined, query: string): boolean {
  if (!text) return false
  return text.toLowerCase().includes(query.toLowerCase())
}

// ===== 公开 API =====
export const store = {
  // --- 分类 ---
  categoryCount() {
    return loadCategories().filter(c => c.parentSlug === null).length
  },

  getCategories(parentSlug?: string | null) {
    const cats = loadCategories()
    const arts = loadArticles()
    const filtered = parentSlug === undefined
      ? cats.filter(c => c.parentSlug === null)
      : cats.filter(c => c.parentSlug === parentSlug)
    return filtered
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(c => ({
        ...withDates(c),
        children: cats.filter(ch => ch.parentSlug === c.slug).sort((a, b) => a.sortOrder - b.sortOrder).map(ch => ({
          ...withDates(ch),
          _count: { articles: arts.filter(a => a.categorySlug === ch.slug).length },
        })),
        _count: { articles: arts.filter(a => a.categorySlug === c.slug).length },
      }))
  },

  getCategory(slug: string) {
    const cats = loadCategories()
    const cat = cats.find(c => c.slug === slug)
    if (!cat) return null
    const arts = loadArticles()
    const children = cats.filter(c => c.parentSlug === slug).sort((a, b) => a.sortOrder - b.sortOrder)
    const parent = cat.parentSlug ? cats.find(c => c.slug === cat.parentSlug) || null : null
    // 包含当前分类及所有子分类的文章
    const childSlugs = children.map(c => c.slug)
    const allSlugs = [slug, ...childSlugs]
    const articles = arts.filter(a => allSlugs.includes(a.categorySlug)).sort((a, b) => a.sortOrder - b.sortOrder || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return {
      ...withDates(cat),
      children: children.map(ch => ({ ...withDates(ch), _count: { articles: arts.filter(a => a.categorySlug === ch.slug).length } })),
      parent: parent ? withDates(parent) : null,
      articles: articles.map(a => attachCategory(a)),
      _count: { articles: articles.length },
    }
  },

  upsertCategory(data: { slug: string; name: string; description?: string | null; icon?: string | null; parentSlug?: string | null; sortOrder?: number }) {
    const cats = loadCategories()
    const now = new Date().toISOString()
    const idx = cats.findIndex(c => c.slug === data.slug)
    if (idx >= 0) {
      cats[idx] = { ...cats[idx], ...data, updatedAt: now }
    } else {
      cats.push({ id: genId(), slug: data.slug, name: data.name, description: data.description ?? null, icon: data.icon ?? null, parentSlug: data.parentSlug ?? null, sortOrder: data.sortOrder ?? 0, createdAt: now, updatedAt: now })
    }
    saveCats(cats)
  },

  // --- 文章 ---
  articleCount(categorySlug?: string) {
    const arts = loadArticles()
    if (!categorySlug) return arts.length
    const cats = loadCategories()
    const childSlugs = cats.filter(c => c.parentSlug === categorySlug).map(c => c.slug)
    const allSlugs = [categorySlug, ...childSlugs]
    return arts.filter(a => allSlugs.includes(a.categorySlug)).length
  },

  getRecentArticles(limit: number) {
    const arts = loadArticles()
    return arts
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
      .map(a => attachCategory(a))
  },

  getArticle(slugOrId: string) {
    const arts = loadArticles()
    const art = arts.find(a => a.id === slugOrId || a.slug === slugOrId)
    if (!art) return null
    return attachCategoryFull(art)
  },

  listArticles(opts?: { categorySlug?: string | string[]; skip?: number; take?: number }) {
    let arts = loadArticles()
    if (opts?.categorySlug) {
      const slugs = Array.isArray(opts.categorySlug) ? opts.categorySlug : [opts.categorySlug]
      arts = arts.filter(a => slugs.includes(a.categorySlug))
    }
    arts.sort((a, b) => a.sortOrder - b.sortOrder || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    const total = arts.length
    if (opts?.skip) arts = arts.slice(opts.skip)
    if (opts?.take) arts = arts.slice(0, opts.take)
    return { articles: arts.map(a => attachCategory(a)), total }
  },

  createArticle(data: { title: string; slug: string; categorySlug: string; summary?: string | null; content: unknown; tags?: string[]; references?: string[]; images?: string[]; searchText?: string | null; sortOrder?: number }) {
    const arts = loadArticles()
    if (arts.find(a => a.slug === data.slug)) throw new Error('Unique constraint: slug已存在')
    const now = new Date().toISOString()
    const art: StoreArticle = {
      id: genId(), slug: data.slug, title: data.title, categorySlug: data.categorySlug,
      summary: data.summary ?? null, content: data.content, tags: data.tags || [],
      references: data.references || [], images: data.images || [],
      searchText: data.searchText ?? null, sortOrder: data.sortOrder ?? 0,
      createdAt: now, updatedAt: now,
    }
    arts.push(art)
    saveArts(arts)
    return attachCategory(art)
  },

  updateArticle(id: string, data: Record<string, unknown>) {
    const arts = loadArticles()
    const idx = arts.findIndex(a => a.id === id)
    if (idx < 0) throw new Error('文章不存在')
    const { id: _id, createdAt: _ca, ...rest } = data
    arts[idx] = { ...arts[idx], ...rest, updatedAt: new Date().toISOString() } as StoreArticle
    saveArts(arts)
    return attachCategory(arts[idx])
  },

  upsertArticle(slug: string, data: { title: string; categorySlug: string; summary?: string | null; content: unknown; tags?: string[]; references?: string[]; images?: string[]; searchText?: string | null; sortOrder?: number }) {
    const arts = loadArticles()
    const idx = arts.findIndex(a => a.slug === slug)
    const now = new Date().toISOString()
    if (idx >= 0) {
      arts[idx] = { ...arts[idx], title: data.title, categorySlug: data.categorySlug, summary: data.summary ?? null, content: data.content, tags: data.tags || [], references: data.references || [], images: data.images || [], searchText: data.searchText ?? null, sortOrder: data.sortOrder ?? 0, updatedAt: now }
      saveArts(arts)
      return attachCategory(arts[idx])
    }
    return store.createArticle({ slug, ...data })
  },

  deleteArticle(id: string) {
    const arts = loadArticles()
    const idx = arts.findIndex(a => a.id === id)
    if (idx < 0) return false
    arts.splice(idx, 1)
    saveArts(arts)
    // 清理关联
    const rels = loadRelations().filter(r => r.fromArticleId !== id && r.toArticleId !== id)
    saveRels(rels)
    return true
  },

  findArticlesBySlugs(slugs: string[]) {
    return loadArticles().filter(a => slugs.includes(a.slug)).map(a => ({ id: a.id, slug: a.slug }))
  },

  searchArticles(q?: string, category?: string, tags?: string, page = 1, pageSize = 20) {
    let arts = loadArticles()
    const cats = loadCategories()

    if (category) {
      const childSlugs = cats.filter(c => c.parentSlug === category).map(c => c.slug)
      const allSlugs = [category, ...childSlugs]
      arts = arts.filter(a => allSlugs.includes(a.categorySlug))
    }

    if (q) {
      arts = arts.filter(a =>
        ilike(a.title, q) || ilike(a.summary, q) || ilike(a.searchText, q) ||
        a.tags.some(t => t.toLowerCase() === q.toLowerCase())
      )
    }

    if (tags) {
      const tagList = tags.split(',').map(t => t.trim().toLowerCase())
      arts = arts.filter(a => a.tags.some(t => tagList.includes(t.toLowerCase())))
    }

    arts.sort((a, b) => a.sortOrder - b.sortOrder || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    const total = arts.length
    const paged = arts.slice((page - 1) * pageSize, page * pageSize)
    return { articles: paged.map(a => attachCategory(a)), total, totalPages: Math.ceil(total / pageSize) }
  },

  // --- 关联 ---
  upsertRelation(fromId: string, toId: string, type = 'related') {
    const rels = loadRelations()
    if (rels.find(r => r.fromArticleId === fromId && r.toArticleId === toId)) return
    rels.push({ id: genId(), fromArticleId: fromId, toArticleId: toId, relationType: type })
    saveRels(rels)
  },

  // --- 同分类上下篇导航 ---
  getArticleNeighbors(slug: string) {
    const arts = loadArticles()
    const art = arts.find(a => a.slug === slug)
    if (!art) return { prev: null, next: null }

    const siblings = arts
      .filter(a => a.categorySlug === art.categorySlug)
      .sort((a, b) => a.sortOrder - b.sortOrder || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

    const idx = siblings.findIndex(a => a.slug === slug)
    return {
      prev: idx > 0 ? { title: siblings[idx - 1].title, slug: siblings[idx - 1].slug } : null,
      next: idx < siblings.length - 1 ? { title: siblings[idx + 1].title, slug: siblings[idx + 1].slug } : null,
    }
  },

  // --- 知识图谱 ---
  getGraphData(category?: string) {
    let arts = loadArticles()
    const cats = loadCategories()
    if (category) arts = arts.filter(a => a.categorySlug === category)

    const nodeIds = new Set(arts.map(a => a.id))
    const nodes = arts.map(a => {
      const cat = cats.find(c => c.slug === a.categorySlug)
      return { id: a.id, name: a.title, category: a.categorySlug, categoryName: cat?.name || '', val: 1 }
    })

    const rels = loadRelations()
    const links = rels
      .filter(r => nodeIds.has(r.fromArticleId) && nodeIds.has(r.toArticleId))
      .map(r => ({ source: r.fromArticleId, target: r.toArticleId, type: r.relationType }))

    return { nodes, links }
  },

  // --- 导出原始数据（供同步用） ---
  rawCategories: loadCategories,
  rawArticles: loadArticles,
  rawRelations: loadRelations,
}
