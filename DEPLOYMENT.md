# ReimX · 线上正式环境部署指南

本文档详细说明如何将 ReimX Web3 报销系统部署到 Vercel 生产环境。

## 🚀 部署前准备

### 1. 环境要求
- Node.js 18+ 运行环境
- PostgreSQL 数据库（推荐 Neon.tech 或 Supabase）
- Vercel 账户

### 2. 必需服务配置

#### 2.1 数据库服务（PostgreSQL）
**推荐方案：Neon.tech**
1. 访问 [Neon.tech](https://neon.tech) 注册账户
2. 创建新项目，选择 PostgreSQL 15+
3. 获取数据库连接字符串：`postgresql://user:password@host:5432/database`

**备选方案：Supabase**
1. 访问 [Supabase](https://supabase.com) 注册账户
2. 创建新项目
3. 在 Settings → Database 获取连接字符串

#### 2.2 邮件服务（Resend）
1. 访问 [Resend](https://resend.com) 注册账户
2. 在 API Keys 页面创建 API Key
3. 验证域名（可选，用于发送邮件）

#### 2.3 Telegram Bot（可选）
1. 联系 [@BotFather](https://t.me/BotFather) 创建机器人
2. 获取 Bot Token
3. 配置 Webhook（如果需要）

## 📋 环境变量配置

### 必需环境变量

在 Vercel 项目设置中配置以下环境变量：

```bash
# 数据库连接
DATABASE_URL="postgresql://user:password@host:5432/database"

# NextAuth 配置
NEXTAUTH_SECRET="your-strong-random-secret-key-minimum-32-chars"
NEXTAUTH_URL="https://your-domain.vercel.app"

# 邮件服务
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# 区块链 RPC（可选，用于链上功能）
ETHEREUM_RPC_URL="https://mainnet.infura.io/v3/your-project-id"
SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
```

### 推荐环境变量

```bash
# 管理员功能
ADMIN_EMAIL="admin@yourcompany.com"

# 安全配置
JWT_SECRET="your-jwt-secret-key"

# 功能开关
ENABLE_TELEGRAM_NOTIFICATIONS="true"
ENABLE_EMAIL_NOTIFICATIONS="true"

# Telegram Bot（可选）
TELEGRAM_BOT_TOKEN="1234567890:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
```

## 🔧 Vercel 部署步骤

### 方法一：通过 GitHub 自动部署（推荐）

1. **准备代码仓库**
   ```bash
   # 确保代码已推送到 GitHub
   git add .
   git commit -m "准备生产环境部署"
   git push origin main
   ```

2. **连接 Vercel**
   - 访问 [Vercel Dashboard](https://vercel.com/dashboard)
   - 点击 "New Project"
   - 选择您的 GitHub 仓库
   - 授权 Vercel 访问仓库

3. **配置项目设置**
   - **Framework Preset**: Next.js
   - **Root Directory**: 保持默认
   - **Build Command**: `pnpm build` 或 `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `pnpm install` 或 `npm install`

4. **配置环境变量**
   - 在项目设置中添加上述所有环境变量
   - 确保 `NEXTAUTH_URL` 设置为您的 Vercel 域名

5. **部署**
   - 点击 "Deploy"
   - Vercel 将自动构建并部署应用

### 方法二：通过 Vercel CLI 部署

1. **安装 Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **部署项目**
   ```bash
   vercel --prod
   ```

4. **配置环境变量**
   ```bash
   vercel env add DATABASE_URL
   vercel env add NEXTAUTH_SECRET
   vercel env add NEXTAUTH_URL
   # 添加其他环境变量...
   ```

## 🗄️ 数据库初始化

### 生产环境数据库迁移

1. **生成 Prisma 客户端**
   ```bash
   pnpm prisma generate
   ```

2. **执行数据库迁移**
   ```bash
   pnpm prisma db push
   ```

3. **创建管理员账户**
   ```bash
   # 通过应用界面注册第一个用户
   # 然后通过数据库将用户角色设置为 admin
   ```

### 数据库备份策略

**Neon.tech 自动备份**
- 自动每日备份
- 支持时间点恢复 (PITR)

**手动备份**
```bash
# 导出数据库
pg_dump $DATABASE_URL > backup.sql

# 导入数据库
psql $DATABASE_URL < backup.sql
```

## 🔒 安全配置

### 1. Vercel 安全设置
- 启用 **Bot Protection**（免费层包含）
- 配置 **Web Application Firewall**（企业版）
- 设置 **Rate Limiting**

### 2. 应用安全
- 使用强密码策略
- 启用 HTTPS 重定向
- 配置 CSP 头
- 定期更新依赖

### 3. 环境安全
- 定期轮换 API Keys
- 使用不同的数据库用户角色
- 限制数据库访问 IP

## 📊 监控与日志

### Vercel Analytics
- 在 Vercel 仪表板启用 Analytics
- 监控性能指标
- 跟踪用户行为

### 错误监控
- 集成 Sentry 或 LogRocket
- 设置错误告警
- 监控 API 响应时间

### 数据库监控
- 使用 Neon.tech 或 Supabase 的监控面板
- 监控查询性能
- 设置慢查询告警

## 🔄 持续部署流程

### 开发工作流
```mermaid
graph LR
    A[开发分支] --> B[创建PR]
    B --> C[Vercel Preview]
    C --> D[代码审查]
    D --> E[合并到main]
    E --> F[自动部署生产]
```

### 部署检查清单
- [ ] 所有环境变量已配置
- [ ] 数据库迁移已执行
- [ ] 功能测试通过
- [ ] 性能测试完成
- [ ] 安全扫描通过

## 🚨 故障排除

### 常见问题

**1. 数据库连接失败**
```bash
# 检查连接
psql $DATABASE_URL -c "SELECT version();"
```

**2. NextAuth 配置错误**
- 确认 `NEXTAUTH_SECRET` 已设置
- 检查 `NEXTAUTH_URL` 是否正确

**3. 构建失败**
```bash
# 本地测试构建
pnpm build
```

**4. 环境变量问题**
```bash
# 检查环境变量
vercel env ls
```

### 日志查看
```bash
# 查看部署日志
vercel logs

# 查看特定部署
vercel logs --url your-app.vercel.app
```

## 📞 支持与维护

### 维护任务
- 每月更新依赖
- 定期备份数据库
- 监控性能指标
- 安全漏洞扫描

### 紧急联系方式
- **技术问题**: 开发团队
- **Vercel 支持**: [Vercel Support](https://vercel.com/support)
- **数据库支持**: Neon.tech/Supabase 支持

## 🔗 相关链接

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- [Neon.tech Documentation](https://neon.tech/docs)

---

**部署状态**: ✅ 准备就绪  
**最后更新**: 2025年10月22日  
**维护团队**: ReimX 开发团队
