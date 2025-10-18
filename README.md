# ReimX · Web3 报销系统

ReimX 是一个基于 Next.js App Router 构建的轻量级 Web3 报销与费用管理系统样板工程，集成了链上支付、汇率快照、通知推送等核心能力，适合部署在 Vercel + Neon 的现代云环境。

## ✨ 功能特性

- **角色权限**：支持成员、审核员、管理员三种角色，使用 NextAuth (JWT) 进行身份与会话管理。
- **报销流程**：覆盖提交、审核、批准、付款、通知的全链路场景，包含链上 Tx 记录字段。
- **汇率服务**：提供 `/api/exchange/*` API，支持实时报价、手动修正与历史曲线查询。
- **数据看板**：预置 Dashboard 页面，展示支出总额、审批通过率、平均处理时长等指标。
- **技术栈**：Next.js 15、TailwindCSS、Prisma、PostgreSQL、Telegram Bot、Resend、ethers.js、@solana/web3.js。

## 📦 快速开始

```bash
pnpm install
pnpm prisma generate
pnpm dev
```

默认开发地址为 [http://localhost:3000](http://localhost:3000)。

> **提示**：项目使用 `DATABASE_URL` 环境变量连接 PostgreSQL，生产环境建议使用 Neon.tech 或 Supabase。

## 🛠️ 环境变量

在根目录创建 `.env` 文件并填入以下变量：

```
DATABASE_URL="postgresql://user:password@host:5432/reimx"
NEXTAUTH_SECRET="<生成一个强随机字符串>"
NEXTAUTH_URL="http://localhost:3000"
RESEND_API_KEY="<Resend API Key>"
TELEGRAM_BOT_TOKEN="<Telegram Bot Token>"
```

根据需要补充链上 RPC、Blob Storage 等变量。

## 🗄️ Prisma 数据模型

详见 [`prisma/schema.prisma`](./prisma/schema.prisma)。模型包含用户与报销两张核心表，拓展字段可以根据业务需求追加。

## 📡 API 约定

- `GET /api/exchange/latest`：获取人民币、港币、美元兑美元的最新汇率。
- `POST /api/exchange/convert`：提交原币金额，返回 USD 等值与汇率来源。
- `GET /api/exchange/history`：返回最近 7 天的汇率快照，便于绘制趋势图表。

以上 API 目前返回模拟数据，便于前端联调；可替换为对 Binance / Coinbase 的真实请求。

## 📈 部署建议

- **平台**：Vercel（Production + Preview）
- **数据库**：Neon.tech 或 Supabase PostgreSQL
- **文件存储**：Vercel Blob Storage，用于报销附件
- **链上依赖**：ethers.js（EVM）、@solana/web3.js（Solana）
- **通知渠道**：Telegram Bot、Resend 邮件

## 📄 许可证

MIT License

