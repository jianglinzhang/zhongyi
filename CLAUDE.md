# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

中医知识库网站 - 个人中医学习知识整理平台。支持通过 API 接口导入结构化中医知识内容，提供分类浏览、全文搜索、知识图谱、暗色模式、PWA 离线访问等功能。

## 技术栈

- **框架**: Next.js 14 (App Router) + TypeScript
- **样式**: Tailwind CSS (暗色模式 class-based)
- **ORM**: Prisma + PostgreSQL
- **存储**: S3 兼容对象存储（图片/附件）
- **部署**: 支持 Railway / Render 等云平台

## 开发命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 生产构建
npm run start        # 启动生产服务器
npm run db:generate  # 生成 Prisma 客户端
npm run db:push      # 推送 schema 到数据库
npm run db:seed      # 初始化分类数据
npm run db:studio    # 打开 Prisma Studio
```

## 项目结构

- `src/app/` - Next.js 页面和 API 路由
- `src/components/` - UI 组件
- `src/lib/` - 工具库（db, s3, auth, categories）
- `src/types/` - TypeScript 类型定义
- `prisma/` - 数据库 schema 和种子数据
- `API_DOCS.md` - 内容上传 API 接口文档

## 分类体系

18 个大类，定义在 `src/lib/categories.ts`：基础理论、诊断方法、中药学、方剂学、经络腧穴、针灸学、推拿按摩、拔罐疗法、刮痧疗法、食疗药膳、养生功法、中医典籍、临床各科、体质辨识、名医传承、中药外治、民间疗法、中西医结合。

## 环境变量

参考 `.env.example`，需要配置 DATABASE_URL、S3 存储、API_KEY。
