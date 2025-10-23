#!/bin/bash

# Vercel 构建脚本
# 处理 Prisma 生成和构建过程

set -e

echo "🚀 Vercel 构建脚本"
echo "=================="

# 检查环境变量
echo "🔍 检查环境配置..."
echo "NODE_ENV: $NODE_ENV"
echo "VERCEL_ENV: $VERCEL_ENV"
echo "DATABASE_URL: ${DATABASE_URL:0:20}..."

# 生成 Prisma 客户端
echo "📦 生成 Prisma 客户端..."
npx prisma generate

# 执行数据库推送（仅在生产环境且有数据库连接时）
if [ "$VERCEL_ENV" = "production" ] && [ -n "$DATABASE_URL" ]; then
    echo "🗄️  推送数据库架构到生产环境..."
    npx prisma db push --accept-data-loss
elif [ "$VERCEL_ENV" = "production" ] && [ -z "$DATABASE_URL" ]; then
    echo "⚠️  生产环境缺少 DATABASE_URL，跳过数据库推送"
else
    echo "ℹ️  非生产环境，跳过数据库推送"
fi

# 构建 Next.js 应用
echo "🔨 构建 Next.js 应用..."
npm run build

echo "✅ 构建完成！"
