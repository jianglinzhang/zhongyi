// 此文件保留供 prisma seed 脚本使用（当配置了 DATABASE_URL 时）
// 应用主数据层已迁移到 store.ts（本地 JSON 文件存储）
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
