# Vercel 部署故障排除指南

本文档帮助解决 ReimX 项目在 Vercel 部署过程中遇到的常见问题。

## 🚨 常见错误及解决方案

### 1. 依赖版本冲突 (ERESOLVE)

**错误信息：**
```
npm error ERESOLVE unable to resolve dependency tree
npm error Found: react@19.0.0-rc.1
npm error Could not resolve dependency:
npm error peer react@"^18 || ^19" from @tanstack/react-query@5.90.5
```

**原因：** React 19 RC 版本与某些依赖包不兼容

**解决方案：**

#### 方法一：使用修复脚本（推荐）
```bash
# 运行依赖修复脚本
pnpm fix:deps

# 或者直接运行
./scripts/fix-dependencies.sh
```

#### 方法二：手动修复
```bash
# 1. 清理依赖
rm -rf node_modules package-lock.json pnpm-lock.yaml

# 2. 修改 package.json 中的版本
# React: 19.0.0-rc.1 → 18.3.1
# Next.js: 15.0.0-canary.163 → 14.2.5

# 3. 重新安装
npm install

# 4. 测试构建
npm run build
```

### 2. 构建失败

**错误信息：**
```
Build failed
Command "npm run build" exited with 1
```

**解决方案：**

1. **检查本地构建**
   ```bash
   # 本地测试构建
   npm run build
   ```

2. **检查环境变量**
   ```bash
   # 确保所有必需的环境变量已设置
   vercel env ls
   ```

3. **检查 Node.js 版本**
   ```bash
   # 在 Vercel 项目设置中指定 Node.js 版本
   # 推荐使用 Node.js 18.x
   ```

### 3. 动态路由构建错误

**错误信息：**
```
Error: Failed to collect page data for /api/admin/reimbursements/[id]/review
```

**解决方案：**

1. **添加动态配置**
   ```bash
   # 运行动态路由修复脚本
   pnpm fix:routes
   ```

2. **手动添加动态配置**
   ```typescript
   // 在 API 路由文件顶部添加
   export const dynamic = "force-dynamic";
   ```

3. **检查路由文件**
   ```bash
   # 确保所有 API 路由都有动态配置
   grep -r "export const dynamic" app/api/
   ```

### 4. Vercel 配置错误

**错误信息：**
```
Error: Function Runtimes must have a valid version, for example `now-php@1.0.0`.
```

**解决方案：**

1. **简化 vercel.json 配置**
   ```json
   {
     "framework": "nextjs",
     "buildCommand": "npm run build",
     "installCommand": "npm install",
     "env": {
       "NODE_ENV": "production"
     }
   }
   ```

2. **删除不必要的配置**
   - 移除 `functions` 配置
   - 移除 `outputDirectory` 配置
   - 让 Vercel 自动检测 Next.js 项目

### 5. Prisma 构建错误

**错误信息：**
```
Learn how: https://pris.ly/d/vercel-build
Error: Failed to collect page data for /api/admin/reimbursements
```

**解决方案：**

1. **更新 Prisma 配置**
   ```typescript
   // lib/prisma.ts
   const createPrismaClient = () => {
     return new PrismaClient({
       log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
       datasources: {
         db: {
           url: process.env.DATABASE_URL,
         },
       },
     });
   };
   ```

2. **创建 Vercel 构建脚本**
   ```bash
   # scripts/vercel-build.sh
   npx prisma generate
   npm run build
   ```

3. **更新 vercel.json**
   ```json
   {
     "buildCommand": "./scripts/vercel-build.sh"
   }
   ```

### 6. 数据库配置错误

**错误信息：**
```
Datasource "db": SQLite database "dev.db" at "file:./dev.db"
SQLite database dev.db created at file:./dev.db
```

**问题：** 生产环境使用了 SQLite 开发数据库，应该使用 PostgreSQL

**解决方案：**

1. **更新 Prisma Schema**
   ```prisma
   // prisma/schema.prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. **确保环境变量配置**
   ```bash
   # 在 Vercel 中设置
   DATABASE_URL="postgresql://username:password@host:5432/database"
   ```

3. **更新构建脚本**
   ```bash
   # scripts/vercel-build.sh
   if [ "$VERCEL_ENV" = "production" ] && [ -n "$DATABASE_URL" ]; then
     npx prisma db push --accept-data-loss
   fi
   ```

### 3. 数据库连接失败

**错误信息：**
```
PrismaClientInitializationError
```

**解决方案：**

1. **检查 DATABASE_URL**
   ```bash
   # 确保数据库连接字符串正确
   echo $DATABASE_URL
   ```

2. **执行数据库迁移**
   ```bash
   # 在 Vercel 构建过程中执行
   npx prisma db push
   ```

3. **检查数据库服务状态**
   - 确保 Neon.tech/Supabase 服务正常运行
   - 检查数据库连接限制

### 4. NextAuth 配置错误

**错误信息：**
```
NEXTAUTH_SECRET is not defined
```

**解决方案：**

1. **生成并设置 NEXTAUTH_SECRET**
   ```bash
   # 生成密钥
   pnpm config:nextauth
   
   # 在 Vercel 中设置环境变量
   vercel env add NEXTAUTH_SECRET
   ```

2. **检查 NEXTAUTH_URL**
   ```bash
   # 确保 URL 格式正确
   NEXTAUTH_URL="https://your-domain.vercel.app"
   ```

## 🔧 部署前检查清单

### 代码准备
- [ ] 代码已推送到 GitHub
- [ ] 本地构建成功 (`npm run build`)
- [ ] 所有测试通过 (`npm test`)
- [ ] 代码 lint 检查通过 (`npm run lint`)

### 环境配置
- [ ] 数据库服务已创建
- [ ] 邮件服务已配置
- [ ] 所有环境变量已设置
- [ ] NextAuth 密钥已生成

### Vercel 配置
- [ ] 项目已连接到 GitHub
- [ ] 构建设置正确
- [ ] 环境变量已配置
- [ ] 域名已设置

## 🛠️ 调试技巧

### 1. 查看构建日志
```bash
# 查看最新部署日志
vercel logs

# 查看特定部署日志
vercel logs --url your-app.vercel.app
```

### 2. 本地测试 Vercel 构建
```bash
# 安装 Vercel CLI
npm i -g vercel

# 本地测试构建
vercel build
```

### 3. 检查环境变量
```bash
# 查看所有环境变量
vercel env ls

# 拉取环境变量到本地
vercel env pull .env.local
```

## 📊 性能优化

### 1. 构建优化
```bash
# 在 package.json 中添加构建优化
{
  "scripts": {
    "build": "next build",
    "postbuild": "prisma generate"
  }
}
```

### 2. 依赖优化
```bash
# 使用 npm 而不是 pnpm（Vercel 默认支持）
# 避免使用实验性版本
# 保持依赖版本稳定
```

### 3. 环境变量优化
```bash
# 只设置必要的环境变量
# 避免在构建时访问数据库
# 使用 Vercel 的环境变量管理
```

## 🚀 最佳实践

### 1. 版本管理
- 使用稳定的 React 18.x 版本
- 使用稳定的 Next.js 14.x 版本
- 避免使用 RC 或 canary 版本

### 2. 依赖管理
- 定期更新依赖
- 使用 `npm audit` 检查安全漏洞
- 保持 package-lock.json 同步

### 3. 构建优化
- 启用 Vercel 的构建缓存
- 使用 Vercel 的 Edge Functions
- 优化图片和静态资源

## 📞 获取帮助

### 官方资源
- [Vercel 文档](https://vercel.com/docs)
- [Next.js 部署指南](https://nextjs.org/docs/deployment)
- [Prisma 部署指南](https://www.prisma.io/docs/guides/deployment)

### 社区支持
- [Vercel 社区](https://github.com/vercel/vercel/discussions)
- [Next.js 社区](https://github.com/vercel/next.js/discussions)
- [Prisma 社区](https://github.com/prisma/prisma/discussions)

---

**故障排除状态**: 🔧 持续更新  
**最后更新**: 2025年10月22日  
**维护团队**: ReimX 开发团队
