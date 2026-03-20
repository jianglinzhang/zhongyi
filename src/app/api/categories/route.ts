import { NextRequest, NextResponse } from 'next/server'
import { store } from '@/lib/store'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const parent = searchParams.get('parent')

  if (parent) {
    const cats = store.getCategories(parent)
    return NextResponse.json(cats)
  }

  const categories = store.getCategories()
  return NextResponse.json(categories)
}
