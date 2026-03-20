// 后台同步模块：将本地数据推送到 PostgreSQL / S3（作为备份）
import { existsSync, readdirSync, readFileSync, writeFileSync, statSync } from 'fs'
import path from 'path'

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data')
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads')
const SYNC_STATE_FILE = path.join(DATA_DIR, '.sync-state.json')

function getFilesRecursive(dir: string): string[] {
  if (!existsSync(dir)) return []
  const files: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...getFilesRecursive(full))
    else files.push(full)
  }
  return files
}

function readSyncState(): Record<string, string> {
  try { return existsSync(SYNC_STATE_FILE) ? JSON.parse(readFileSync(SYNC_STATE_FILE, 'utf-8')) : {} } catch { return {} }
}
function writeSyncState(state: Record<string, string>) {
  writeFileSync(SYNC_STATE_FILE, JSON.stringify(state), 'utf-8')
}

async function syncToDatabase() {
  if (!process.env.DATABASE_URL) return
  try {
    const { PrismaClient } = await import('@prisma/client')
    // Neon 等云数据库可能带 channel_binding 等不支持的参数，自动清理
    let dbUrl = process.env.DATABASE_URL
    try {
      const u = new URL(dbUrl)
      u.searchParams.delete('channel_binding')
      if (!u.searchParams.has('sslmode') && dbUrl.includes('neon.tech')) {
        u.searchParams.set('sslmode', 'require')
      }
      dbUrl = u.toString()
    } catch {}
    const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } })

    // 先尝试推送 schema（确保远程数据库有表结构）
    try {
      const { execSync } = await import('child_process')
      execSync(`npx prisma db push --skip-generate --accept-data-loss`, {
        env: { ...process.env, DATABASE_URL: dbUrl },
        stdio: 'pipe',
        timeout: 30000,
      })
    } catch {}

    const { store } = await import('./store')

    // 同步分类
    const categories = store.rawCategories()
    for (const cat of categories) {
      await prisma.category.upsert({
        where: { slug: cat.slug },
        update: { name: cat.name, description: cat.description, icon: cat.icon, parentSlug: cat.parentSlug, sortOrder: cat.sortOrder },
        create: { id: cat.id, slug: cat.slug, name: cat.name, description: cat.description, icon: cat.icon, parentSlug: cat.parentSlug, sortOrder: cat.sortOrder },
      })
    }

    // 同步文章
    const articles = store.rawArticles()
    for (const art of articles) {
      await prisma.article.upsert({
        where: { slug: art.slug },
        update: {
          title: art.title, categorySlug: art.categorySlug, summary: art.summary,
          content: art.content as any, tags: art.tags, references: art.references,
          images: art.images, searchText: art.searchText, sortOrder: art.sortOrder,
        },
        create: {
          id: art.id, slug: art.slug, title: art.title, categorySlug: art.categorySlug,
          summary: art.summary, content: art.content as any, tags: art.tags,
          references: art.references, images: art.images, searchText: art.searchText,
          sortOrder: art.sortOrder,
        },
      })
    }

    // 同步关联
    const relations = store.rawRelations()
    for (const rel of relations) {
      await prisma.articleRelation.upsert({
        where: { fromArticleId_toArticleId: { fromArticleId: rel.fromArticleId, toArticleId: rel.toArticleId } },
        update: { relationType: rel.relationType },
        create: { fromArticleId: rel.fromArticleId, toArticleId: rel.toArticleId, relationType: rel.relationType },
      })
    }

    await prisma.$disconnect()
    console.log(`[sync] 数据库同步完成: ${categories.length} 分类, ${articles.length} 文章, ${relations.length} 关联`)
  } catch (e) {
    console.error('[sync] 数据库同步失败:', e instanceof Error ? e.message : e)
  }
}

async function syncToS3() {
  if (!process.env.S3_ENDPOINT || !process.env.S3_ACCESS_KEY || !process.env.S3_SECRET_KEY) return
  if (!existsSync(UPLOADS_DIR)) return

  try {
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')
    const client = new S3Client({
      region: process.env.S3_REGION || 'auto',
      endpoint: process.env.S3_ENDPOINT,
      credentials: { accessKeyId: process.env.S3_ACCESS_KEY!, secretAccessKey: process.env.S3_SECRET_KEY! },
      forcePathStyle: true,
    })

    const state = readSyncState()
    const bucket = process.env.S3_BUCKET || 'zhongyi'

    const localFiles = getFilesRecursive(UPLOADS_DIR)
    let synced = 0
    for (const filePath of localFiles) {
      const key = path.relative(UPLOADS_DIR, filePath).replace(/\\/g, '/')
      const mtime = statSync(filePath).mtime.toISOString()
      if (state[key] === mtime) continue // 已同步

      const body = readFileSync(filePath)
      const ext = path.extname(filePath).slice(1)
      const contentTypeMap: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml' }
      await client.send(new PutObjectCommand({
        Bucket: bucket, Key: key, Body: body,
        ContentType: contentTypeMap[ext] || 'application/octet-stream',
      }))

      state[key] = mtime
      synced++
    }

    writeSyncState(state)
    if (synced > 0) console.log(`[sync] S3同步完成: ${synced} 个文件`)
  } catch (e) {
    console.error('[sync] S3同步失败:', e instanceof Error ? e.message : e)
  }
}

export async function performSync() {
  await Promise.all([syncToDatabase(), syncToS3()])
}
