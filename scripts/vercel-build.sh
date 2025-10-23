#!/bin/bash

# Vercel 构建脚本
# 处理 Prisma 生成和构建过程

set -e

echo "🚀 Vercel 构建脚本"
echo "=================="

# 生成 Prisma 客户端
echo "📦 生成 Prisma 客户端..."
npx prisma generate

# 执行数据库推送（仅在构建时）
if [ "$VERCEL_ENV" = "production" ]; then
    echo "🗄️  推送数据库架构..."
    npx prisma db push --accept-data-loss
fi

# 构建 Next.js 应用
echo "🔨 构建 Next.js 应用..."
npm run build

echo "✅ 构建完成！"
