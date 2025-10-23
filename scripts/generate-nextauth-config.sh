#!/bin/bash

# NextAuth 配置生成脚本
# 用于生成生产环境所需的 NextAuth 配置

echo "🔐 NextAuth 配置生成器"
echo "========================"

# 检查是否安装了 OpenSSL
if ! command -v openssl &> /dev/null; then
    echo "❌ OpenSSL 未安装，请先安装 OpenSSL"
    echo "   macOS: brew install openssl"
    echo "   Ubuntu: sudo apt-get install openssl"
    exit 1
fi

echo "✅ OpenSSL 已安装"

# 生成 NEXTAUTH_SECRET
echo ""
echo "🔑 生成 NEXTAUTH_SECRET..."
NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo "NEXTAUTH_SECRET=\"$NEXTAUTH_SECRET\""

# 生成 JWT_SECRET
echo ""
echo "🔑 生成 JWT_SECRET..."
JWT_SECRET=$(openssl rand -base64 32)
echo "JWT_SECRET=\"$JWT_SECRET\""

# 生成示例配置
echo ""
echo "📋 完整的 NextAuth 环境变量配置："
echo "=================================="
echo ""
echo "# NextAuth 配置"
echo "NEXTAUTH_SECRET=\"$NEXTAUTH_SECRET\""
echo "NEXTAUTH_URL=\"https://your-domain.vercel.app\""
echo "JWT_SECRET=\"$JWT_SECRET\""
echo ""
echo "# 数据库配置"
echo "DATABASE_URL=\"postgresql://username:password@host:5432/database_name\""
echo ""
echo "# 邮件服务"
echo "RESEND_API_KEY=\"re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\""
echo ""
echo "📝 使用说明："
echo "1. 复制上述配置到 Vercel 环境变量"
echo "2. 将 NEXTAUTH_URL 替换为您的实际域名"
echo "3. 配置其他必需的环境变量"
echo ""
echo "⚠️  安全提醒："
echo "- 请妥善保管这些密钥"
echo "- 不要将密钥提交到代码仓库"
echo "- 定期轮换密钥（建议每6个月）"
echo ""
