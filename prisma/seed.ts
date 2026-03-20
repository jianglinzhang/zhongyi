import { PrismaClient } from '@prisma/client'
import { CATEGORIES } from '../src/lib/categories'

const prisma = new PrismaClient()

async function seed() {
  console.log('开始初始化分类数据...')

  for (let i = 0; i < CATEGORIES.length; i++) {
    const cat = CATEGORIES[i]

    // 创建大类
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, icon: cat.icon, sortOrder: i },
      create: {
        slug: cat.slug,
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        sortOrder: i,
      },
    })

    // 创建小类
    for (let j = 0; j < cat.children.length; j++) {
      const child = cat.children[j]
      await prisma.category.upsert({
        where: { slug: child.slug },
        update: { name: child.name, description: child.description || null, parentSlug: cat.slug, sortOrder: j },
        create: {
          slug: child.slug,
          name: child.name,
          description: child.description || null,
          parentSlug: cat.slug,
          icon: cat.icon,
          sortOrder: j,
        },
      })
    }
  }

  const count = await prisma.category.count()
  console.log(`分类数据初始化完成，共 ${count} 个分类`)
}

seed()
  .catch((e) => {
    console.error('初始化失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
