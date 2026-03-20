import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data')

export async function uploadFile(
  file: Buffer,
  key: string,
  _contentType: string
): Promise<string> {
  // 始终保存到本地（本地为主存储）
  const uploadDir = path.join(DATA_DIR, 'uploads')
  const filePath = path.join(uploadDir, key)
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, file)

  // 同时保存到 public/uploads 供 Next.js 静态访问
  const publicDir = path.join(process.cwd(), 'public', 'uploads')
  const publicPath = path.join(publicDir, key)
  await mkdir(path.dirname(publicPath), { recursive: true })
  await writeFile(publicPath, file)

  // S3 同步由 sync 模块自动处理
  return `/uploads/${key}`
}
