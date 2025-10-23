#!/bin/bash

# 修复动态路由警告脚本
# 为所有 API 路由添加 dynamic 配置

echo "🔧 修复动态路由警告..."
echo "========================"

# 查找所有 API 路由文件
API_ROUTES=$(find app/api -name "route.ts" -type f)

echo "📁 找到以下 API 路由文件："
echo "$API_ROUTES"
echo ""

# 为每个路由文件添加 dynamic 配置
for route in $API_ROUTES; do
    echo "🔧 处理: $route"
    
    # 检查是否已经有 dynamic 配置
    if grep -q "export const dynamic" "$route"; then
        echo "  ✅ 已存在 dynamic 配置"
        continue
    fi
    
    # 在文件开头添加 dynamic 配置
    sed -i '1i\
export const dynamic = "force-dynamic";\
' "$route"
    
    echo "  ✅ 已添加 dynamic 配置"
done

echo ""
echo "🎉 动态路由配置完成！"
echo ""
echo "📋 修改内容："
echo "- 为所有 API 路由添加了 'export const dynamic = \"force-dynamic\"'"
echo "- 这将消除构建时的动态服务器使用警告"
echo ""
echo "🚀 现在可以重新构建："
echo "npm run build"
echo ""
