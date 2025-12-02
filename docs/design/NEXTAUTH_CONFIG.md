# NextAuth 配置指南

本文档详细说明如何为 ReimX 系统配置 NextAuth.js 认证。

## 🔐 核心配置

### 1. NEXTAUTH_SECRET

这是 NextAuth.js 最重要的安全密钥，用于：
- 加密 JWT token
- 签名会话 cookie
- 保护 CSRF token

#### 生成方法

**方法一：使用脚本（推荐）**
```bash
# 运行项目提供的生成脚本
./scripts/generate-nextauth-config.sh
```

**方法二：手动生成**
```bash
# 使用 OpenSSL
openssl rand -base64 32

# 使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**方法三：在线生成（仅开发环境）**
访问 [NextAuth.js Secret Generator](https://generate-secret.vercel.app/32)

### 2. NEXTAUTH_URL

设置应用的完整 URL，包括协议和域名。

```bash
# 开发环境
NEXTAUTH_URL="http://localhost:3000"

# 生产环境
NEXTAUTH_URL="https://your-app.vercel.app"
```

## 📋 完整环境变量配置

### 必需配置

```bash
# NextAuth 核心配置
NEXTAUTH_SECRET="your-32-character-base64-secret"
NEXTAUTH_URL="https://your-domain.vercel.app"

# 数据库连接
DATABASE_URL="postgresql://username:password@host:5432/database"

# 邮件服务
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### 可选配置

```bash
# JWT 配置
JWT_SECRET="your-jwt-secret-key"

# 管理员配置
ADMIN_EMAIL="admin@yourcompany.com"

# 功能开关
ENABLE_EMAIL_NOTIFICATIONS="true"
ENABLE_TELEGRAM_NOTIFICATIONS="true"

# Telegram Bot
TELEGRAM_BOT_TOKEN="1234567890:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
```

## 🛠️ 在 Vercel 中配置

### 1. 通过 Vercel Dashboard

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择您的项目
3. 进入 Settings → Environment Variables
4. 添加以下变量：

| 变量名 | 值 | 环境 |
|--------|-----|------|
| `NEXTAUTH_SECRET` | 生成的密钥 | Production, Preview, Development |
| `NEXTAUTH_URL` | 您的域名 | Production, Preview, Development |
| `DATABASE_URL` | 数据库连接字符串 | Production, Preview, Development |
| `RESEND_API_KEY` | Resend API Key | Production, Preview, Development |

### 2. 通过 Vercel CLI

```bash
# 添加环境变量
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
vercel env add DATABASE_URL
vercel env add RESEND_API_KEY

# 查看环境变量
vercel env ls

# 拉取环境变量到本地
vercel env pull .env.local
```

## 🔧 应用配置

### 1. NextAuth 配置文件

在 `app/api/auth/[...nextauth]/route.ts` 中：

```typescript
import NextAuth from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.username,
          role: user.role,
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub
        session.user.role = token.role
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
    signUp: "/register",
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export default NextAuth(authOptions)
```

### 2. 类型定义

在 `types/next-auth.d.ts` 中：

```typescript
import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
    }
  }

  interface User {
    role: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
  }
}
```

## 🧪 测试配置

### 1. 本地测试

```bash
# 启动开发服务器
pnpm dev

# 访问认证页面
open http://localhost:3000/login
open http://localhost:3000/register
```

### 2. 生产环境测试

```bash
# 部署到预览环境
vercel

# 测试认证流程
# 1. 注册新用户
# 2. 登录用户
# 3. 访问受保护页面
# 4. 登出用户
```

## 🔒 安全最佳实践

### 1. 密钥管理

- ✅ 使用强随机密钥（至少 32 字符）
- ✅ 定期轮换密钥（建议每 6 个月）
- ✅ 不要在代码中硬编码密钥
- ✅ 使用环境变量存储密钥

### 2. 会话安全

- ✅ 启用 HTTPS（Vercel 自动处理）
- ✅ 配置安全的 cookie 设置
- ✅ 设置合理的会话过期时间
- ✅ 实现会话超时机制

### 3. 密码安全

- ✅ 使用 bcrypt 加密密码
- ✅ 实施密码强度要求
- ✅ 实现密码重置功能
- ✅ 监控异常登录尝试

## 🚨 故障排除

### 常见问题

**1. "NEXTAUTH_SECRET is not defined"**
```bash
# 检查环境变量是否设置
echo $NEXTAUTH_SECRET

# 在 Vercel 中检查环境变量
vercel env ls
```

**2. "Invalid NEXTAUTH_URL"**
```bash
# 确保 URL 格式正确
NEXTAUTH_URL="https://your-domain.vercel.app"  # ✅ 正确
NEXTAUTH_URL="your-domain.vercel.app"          # ❌ 错误
```

**3. 认证失败**
- 检查数据库连接
- 验证用户凭据
- 查看服务器日志

### 调试技巧

```bash
# 启用 NextAuth 调试
NEXTAUTH_DEBUG=true

# 查看详细日志
vercel logs --follow
```

## 📚 相关资源

- [NextAuth.js 官方文档](https://next-auth.js.org/)
- [Vercel 环境变量文档](https://vercel.com/docs/concepts/projects/environment-variables)
- [Prisma 适配器文档](https://next-auth.js.org/adapters/prisma)

---

**配置状态**: ✅ 准备就绪  
**最后更新**: 2025年10月22日  
**维护团队**: ReimX 开发团队
