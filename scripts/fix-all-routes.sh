#!/bin/bash

# 修复所有 API 路由的动态配置脚本

echo "🔧 修复所有 API 路由的动态配置..."
echo "=================================="

# 查找所有缺少动态配置的 API 路由
ROUTES=$(find app/api -name "route.ts" -exec grep -L "export const dynamic" {} \;)

echo "📁 找到需要修复的路由文件："
echo "$ROUTES"
echo ""

# 为每个路由文件添加动态配置
for route in $ROUTES; do
    echo "🔧 处理: $route"
    
    # 检查是否已经有 dynamic 配置
    if grep -q "export const dynamic" "$route"; then
        echo "  ✅ 已存在 dynamic 配置"
        continue
    fi
    
    # 在 import 语句后添加 dynamic 配置
    # 找到最后一个 import 语句的行号
    last_import_line=$(grep -n "^import" "$route" | tail -1 | cut -d: -f1)
    
    if [ -n "$last_import_line" ]; then
        # 在最后一个 import 语句后插入 dynamic 配置
        sed -i '' "${last_import_line}a\\
\\
export const dynamic = \"force-dynamic\";" "$route"
        echo "  ✅ 已添加 dynamic 配置"
    else
        echo "  ❌ 未找到 import 语句"
    fi
done

echo ""
echo "🎉 动态路由配置完成！"
echo ""
echo "📋 修复内容："
echo "- 为所有 API 路由添加了 'export const dynamic = \"force-dynamic\"'"
echo "- 这将消除构建时的动态服务器使用警告"
echo ""
echo "🚀 现在可以重新构建："
echo "npm run build"
echo ""
