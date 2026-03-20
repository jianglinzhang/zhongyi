import { NextRequest, NextResponse } from 'next/server'

export function checkAuth(req: NextRequest): NextResponse | null {
  const apiKey = process.env.API_KEY
  if (!apiKey) return null

  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${apiKey}`) {
    return NextResponse.json({ error: '未授权，请提供有效的API密钥' }, { status: 401 })
  }
  return null
}
