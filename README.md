# ReimX · Web3 报销系统

ReimX 是一个基于 Next.js App Router 构建的轻量级 Web3 报销与费用管理系统样板工程，集成了链上支付、汇率快照、通知推送等核心能力，适合部署在 Vercel + Neon 的现代云环境。

## ✨ 功能特性

- **角色权限**：支持成员、审核员、管理员三种角色，使用 NextAuth (JWT) 进行身份与会话管理。
- **报销流程**：覆盖提交、审核、批准、付款、通知的全链路场景，包含链上 Tx 记录字段。
- **汇率服务**：提供 `/api/exchange/*` API，支持实时报价、手动修正与历史曲线查询。
- **数据看板**：预置 Dashboard 页面，展示支出总额、审批通过率、平均处理时长等指标。
- **技术栈**：Next.js 15、TailwindCSS、Prisma、SQLite/PostgreSQL、Telegram Bot、Resend、ethers.js、@solana/web3.js。

## 📦 快速开始

### 环境要求

- Node.js 18+ 
- pnpm (推荐) 或 npm/yarn

### 本地开发启动

1. **克隆项目**
```bash
git clone <repository-url>
cd ReimX
```

2. **安装依赖**
```bash
pnpm install
```

3. **配置数据库**
```bash
# 生成 Prisma 客户端
pnpm prisma generate

# 创建数据库表（使用 SQLite 开发）
pnpm prisma db push
```

4. **启动开发服务器**

   **方式一：使用便捷脚本（推荐）**
   ```bash
   # 启动开发环境
   pnpm dev:start
   
   # 停止开发环境
   pnpm dev:stop
   
   # 重启开发环境
   pnpm dev:restart
   
   # 查看运行状态
   pnpm dev:status
   ```

   **方式二：直接使用脚本**
   ```bash
   # Linux/macOS
   ./scripts/dev.sh start
   ./scripts/dev.sh stop
   ./scripts/dev.sh restart
   ./scripts/dev.sh status
   
   # Windows
   scripts\dev.bat start
   scripts\dev.bat stop
   scripts\dev.bat restart
   scripts\dev.bat status
   ```

   **方式三：传统方式**
   ```bash
   pnpm dev
   ```

5. **访问应用**
- 主页：http://localhost:3000
- 注册：http://localhost:3000/register  
- 登录：http://localhost:3000/login
- 控制台：http://localhost:3000/dashboard

### 开发环境说明

- **数据库**：开发环境默认使用 SQLite (`./dev.db`)，无需额外配置
- **认证**：使用 NextAuth.js JWT 策略，开发环境自动配置
- **热重载**：支持文件修改自动刷新
- **TypeScript**：完整的类型支持

> **提示**：生产环境建议使用 PostgreSQL (Neon.tech 或 Supabase)，需要配置 `DATABASE_URL` 环境变量。

## 🛠️ 环境变量

### 开发环境（可选）

开发环境使用 SQLite，无需配置环境变量即可运行。如需使用 PostgreSQL，创建 `.env` 文件：

```bash
# 数据库连接
DATABASE_URL="postgresql://user:password@host:5432/reimx"

# NextAuth 配置
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# 邮件服务（可选）
RESEND_API_KEY="your-resend-api-key"

# Telegram Bot（可选）
TELEGRAM_BOT_TOKEN="your-telegram-bot-token"

# 区块链 RPC（可选）
ETHEREUM_RPC_URL="https://mainnet.infura.io/v3/your-project-id"
SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
```

### 生产环境

生产环境必须配置以下环境变量：

```bash
# 必需
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="<强随机字符串>"
NEXTAUTH_URL="https://your-domain.com"

# 推荐
RESEND_API_KEY="<Resend API Key>"
TELEGRAM_BOT_TOKEN="<Telegram Bot Token>"
```

## 🧪 测试

项目包含完整的测试套件，覆盖 API、组件、页面和集成测试：

```bash
# 运行所有测试
pnpm test

# 运行测试并生成覆盖率报告
pnpm test:coverage

# 监听模式运行测试
pnpm test:watch
```

### 测试覆盖范围

- **API 测试**：用户注册、登录、资料管理、管理员功能
- **组件测试**：导航组件、表单组件
- **页面测试**：注册页面、登录页面
- **集成测试**：完整的用户流程测试

## 🗄️ Prisma 数据模型

详见 [`prisma/schema.prisma`](./prisma/schema.prisma)。模型包含用户与报销两张核心表，拓展字段可以根据业务需求追加。

### 数据库操作

```bash
# 查看数据库状态
pnpm prisma studio

# 重置数据库
pnpm prisma db push --force-reset

# 生成迁移文件（PostgreSQL）
pnpm prisma migrate dev
```

## 📡 API 约定

### 用户管理 API

- `POST /api/users/register`：用户注册
- `GET /api/users/profile`：获取用户资料
- `PUT /api/users/profile`：更新用户资料
- `GET /api/admin/users`：管理员获取用户列表
- `PUT /api/admin/users/[id]`：管理员更新用户信息
- `DELETE /api/admin/users/[id]`：管理员删除用户

### 认证 API

- `POST /api/auth/signin`：用户登录
- `POST /api/auth/signout`：用户登出
- `GET /api/auth/session`：获取当前会话

### 汇率服务 API

- `GET /api/exchange/latest`：获取人民币、港币、美元兑美元的最新汇率
- `POST /api/exchange/convert`：提交原币金额，返回 USD 等值与汇率来源
- `GET /api/exchange/history`：返回最近 7 天的汇率快照，便于绘制趋势图表

> **注意**：汇率 API 目前返回模拟数据，便于前端联调；可替换为对 Binance / Coinbase 的真实请求。

## 📁 项目结构

```
ReimX/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   │   ├── auth/          # 认证相关
│   │   ├── users/         # 用户管理
│   │   └── admin/         # 管理员功能
│   ├── register/          # 注册页面
│   ├── login/             # 登录页面
│   ├── dashboard/         # 控制台
│   ├── profile/           # 个人资料
│   └── admin/             # 管理后台
├── components/            # React 组件
├── lib/                   # 工具函数
├── prisma/               # 数据库模式
├── __tests__/            # 测试文件
│   ├── api/              # API 测试
│   ├── pages/            # 页面测试
│   ├── components/       # 组件测试
│   └── integration/      # 集成测试
└── design/               # 设计文档
```

## 📈 部署建议

- **平台**：Vercel（Production + Preview）
- **数据库**：Neon.tech 或 Supabase PostgreSQL
- **文件存储**：Vercel Blob Storage，用于报销附件
- **链上依赖**：ethers.js（EVM）、@solana/web3.js（Solana）
- **通知渠道**：Telegram Bot、Resend 邮件

## 🚀 生产环境部署

详细的线上正式环境部署指南请参考：

- [📋 部署指南](./DEPLOYMENT.md) - 完整的 Vercel 部署说明
- [✅ 部署检查清单](./DEPLOYMENT_CHECKLIST.md) - 部署前检查清单
- [⚙️ 环境变量模板](./env.production.example) - 生产环境配置模板
- [🔧 部署脚本](./scripts/deploy-production.sh) - 自动化部署脚本

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

MIT License

