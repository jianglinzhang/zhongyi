#!/bin/sh
set -e

echo "==> 同步数据库结构..."
npx prisma db push --skip-generate

echo "==> 初始化分类数据..."
npx tsx prisma/seed.ts

echo "==> 启动应用服务..."
exec npm start
