#!/bin/bash

# ReimX 生产环境部署脚本
# 使用前请确保已安装 Vercel CLI 并登录

set -e

echo "🚀 ReimX 生产环境部署开始..."

# 检查 Vercel CLI 是否安装
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI 未安装，请先安装: npm i -g vercel"
    exit 1
fi

# 检查是否已登录
if ! vercel whoami &> /dev/null; then
    echo "❌ 请先登录 Vercel: vercel login"
    exit 1
fi

echo "✅ 环境检查通过"

# 构建项目
echo "📦 构建项目..."
pnpm build

# 部署到生产环境
echo "🚀 部署到生产环境..."
vercel --prod

echo ""
echo "🎉 部署完成！"
echo ""
echo "📋 后续步骤："
echo "1. 在 Vercel 控制台配置环境变量"
echo "2. 执行数据库迁移: pnpm prisma db push"
echo "3. 测试应用功能"
echo ""
echo "🔗 相关链接："
echo "- Vercel 控制台: https://vercel.com/dashboard"
echo "- 部署文档: ./DEPLOYMENT.md"
echo ""
