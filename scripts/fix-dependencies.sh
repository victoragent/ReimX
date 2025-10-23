#!/bin/bash

# 修复 Vercel 部署依赖冲突脚本
# 解决 React 19 RC 和 Next.js 15 canary 版本兼容性问题

set -e

echo "🔧 修复 Vercel 部署依赖冲突..."
echo "================================"

# 检查是否存在 node_modules
if [ -d "node_modules" ]; then
    echo "🗑️  清理现有的 node_modules..."
    rm -rf node_modules
fi

# 检查是否存在 package-lock.json
if [ -f "package-lock.json" ]; then
    echo "🗑️  清理 package-lock.json..."
    rm package-lock.json
fi

# 检查是否存在 pnpm-lock.yaml
if [ -f "pnpm-lock.yaml" ]; then
    echo "🗑️  清理 pnpm-lock.yaml..."
    rm pnpm-lock.yaml
fi

echo "✅ 清理完成"

# 重新安装依赖
echo ""
echo "📦 重新安装依赖..."
echo "使用 npm 安装以确保 Vercel 兼容性..."

npm install

echo ""
echo "✅ 依赖安装完成"

# 测试构建
echo ""
echo "🧪 测试构建..."
npm run build

echo ""
echo "🎉 修复完成！"
echo ""
echo "📋 修复内容："
echo "- React: 19.0.0-rc.1 → 18.3.1"
echo "- React DOM: 19.0.0-rc.1 → 18.3.1"
echo "- Next.js: 15.0.0-canary.163 → 14.2.5"
echo "- ESLint: 9.11.1 → 8.57.0"
echo "- ESLint Config Next: 15.0.0-canary.163 → 14.2.5"
echo ""
echo "🚀 现在可以重新部署到 Vercel："
echo "vercel --prod"
echo ""
