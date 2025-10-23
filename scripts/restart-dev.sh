#!/bin/bash

# 重启开发服务脚本
# 清理所有端口占用并重新启动服务

set -e

echo "🔄 重启开发服务..."
echo "=================="

# 停止所有 Next.js 进程
echo "🛑 停止现有服务..."
pkill -f "next dev" 2>/dev/null || echo "  没有运行中的 Next.js 进程"

# 清理端口占用
echo "🧹 清理端口占用..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "  端口 3000 已清理"
lsof -ti:3001 | xargs kill -9 2>/dev/null || echo "  端口 3001 已清理"

# 等待进程完全停止
sleep 2

# 重新启动服务
echo "🚀 启动开发服务..."
cd /Users/xiaoyi/codespace/ai/ReimX
pnpm dev &

# 等待服务启动
sleep 5

# 检查服务状态
echo "🔍 检查服务状态..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ 服务在端口 3000 启动成功"
    echo "🔗 访问地址: http://localhost:3000"
elif curl -s http://localhost:3001 > /dev/null; then
    echo "✅ 服务在端口 3001 启动成功"
    echo "🔗 访问地址: http://localhost:3001"
else
    echo "❌ 服务启动失败"
    exit 1
fi

echo ""
echo "📋 可用页面:"
echo "- 主页: http://localhost:3000 (或 3001)"
echo "- 注册: http://localhost:3000/register"
echo "- 登录: http://localhost:3000/login"
echo "- 控制台: http://localhost:3000/dashboard"
echo "- 管理后台: http://localhost:3000/admin"
echo ""
