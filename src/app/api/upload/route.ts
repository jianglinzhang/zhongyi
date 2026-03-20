import { NextRequest, NextResponse } from 'next/server'
import { checkAuth } from '@/lib/auth'
import { uploadFile } from '@/lib/s3'

export async function POST(req: NextRequest) {
  const authError = checkAuth(req)
  if (authError) return authError

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: '请上传文件' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: `不支持的文件类型：${file.type}` }, { status: 400 })
    }

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: '文件大小不能超过10MB' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = file.name.split('.').pop() || 'jpg'
    const key = `images/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const url = await uploadFile(buffer, key, file.type)

    return NextResponse.json({ url, key })
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '上传失败' }, { status: 500 })
  }
}
