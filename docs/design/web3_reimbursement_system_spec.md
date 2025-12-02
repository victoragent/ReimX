# 📘 Web3 报销系统（Web3 Reimbursement System）

```yaml
version: 1.1
project: "Web3 报销系统"
description: "基于 Next.js + Vercel 的轻量级 Web3 报销与费用管理系统"
deployment:
  platform: "Vercel"
  environment: "Production + Preview (auto from GitHub)"
  runtime: "Node.js 20+"
  database: "PostgreSQL (Neon.tech / Supabase)"
  storage: "Vercel Blob Storage"
  auth: "NextAuth.js (Email + JWT)"
  web3:
    evm: true
    solana: true
    libs:
      - ethers.js
      - "@solana/web3.js"
  notification:
    telegram: true
    email: "Resend API"
```

## 👥 角色与权限

```yaml
roles:
  - user:
      description: "普通成员，可提交报销、查看状态、修改个人信息"
  - reviewer:
      description: "审核员，负责审核报销、驳回或批准"
  - admin:
      description: "管理员，管理用户、权限、执行付款、查看报表"
```

## 🧱 模块设计

### 用户管理模块（User Management）

```yaml
features:
  - register: "邮箱注册"
  - login: "邮箱+密码登录"
  - edit_profile: "修改个人资料（用户名、邮箱、TG、WhatsApp、EVM地址、Solana地址）"
  - change_password: "修改密码"
  - reset_password: "忘记密码（邮件Token重置）"
  - admin_user_control: "管理员维护、禁用、删除、审核变更"
  - salary_management: "管理员设置和发放工资"
fields:
  user:
    - id: string
    - username: string
    - email: string
    - password: string (hashed)
    - tg_account: string
    - whatsapp_account: string
    - evm_address: string
    - solana_address: string
    - chain_addresses: string (JSON)
    - role: enum[user, reviewer, admin]
    - status: enum[active, suspended, pending]
    - is_approved: boolean
    - approved_by: string (ref: user.id)
    - approved_at: datetime
    - salary_usdt: decimal
    - created_at: datetime
    - updated_at: datetime
```

### 报销模块（Reimbursement System）

```yaml
features:
  - submit: "用户填写报销申请（支持RMB/HKD/USD）"
  - review: "审核员审批（批准/驳回）"
  - pay: "管理员执行支付（手动或链上）"
  - history: "查看个人报销历史"
  - notifications: "提交/审核/付款自动通知"
  - rate_lock: "报销时锁定汇率"
fields:
  reimbursement:
    - id: string
    - applicant_id: string (ref: user.id)
    - title: string
    - description: text
    - expense_type: string (default: "other")
    - amount_original: decimal
    - currency: enum[RMB, HKD, USD]
    - exchange_rate_to_usd: decimal
    - amount_usd_equivalent: decimal
    - exchange_rate_source: string
    - exchange_rate_time: datetime
    - is_manual_rate: boolean
    - converted_by: string (ref: user.id)
    - chain: enum[evm, solana]
    - receipt_url: string
    - status: enum[submitted, reviewing, approved, rejected, paid]
    - reviewer_id: string (ref: user.id)
    - approver_id: string (ref: user.id)
    - review_comment: string
    - reviewed_at: datetime
    - tx_hash: string
    - created_at: datetime
    - updated_at: datetime
```

### 薪资管理模块（Salary Management）

```yaml
features:
  - monthly_salary: "按月发放工资（USDT）"
  - status_tracking: "追踪支付状态（Pending/Scheduled/Paid）"
  - payment_history: "查看薪资发放记录"
fields:
  salary_payment:
    - id: string
    - user_id: string (ref: user.id)
    - month: string (YYYY-MM)
    - amount_usdt: decimal
    - status: enum[pending, scheduled, paid]
    - scheduled_at: datetime
    - paid_at: datetime
    - transaction_hash: string
    - notes: string
    - created_at: datetime
    - updated_at: datetime
```

### 汇率与货币转换模块（Exchange Service）

```yaml
features:
  - real_time_quote: "获取实时汇率（RMB/HKD/USD → USD）"
  - rate_lock_snapshot: "提交报销时锁定汇率"
  - manual_adjustment: "管理员可人工修正"
  - historical_query: "可查历史汇率"
api:
  - GET /api/exchange/latest
  - POST /api/exchange/convert
  - GET /api/exchange/history
example_response:
  amount_usd: 137.0
  exchange_rate: 0.137
  source: "Binance"
  timestamp: "2025-10-17T18:05:00Z"
```

### 报表与数据分析模块（Analytics）

```yaml
features:
  - total_reimbursement_usd: "汇总总支出（USD）"
  - reimbursement_distribution: "按币种分布"
  - trend_chart: "月度支出趋势"
  - review_efficiency: "审核平均时长、驳回率"
  - export: "导出CSV/XLSX"
visualization:
  - Chart.js
  - Recharts
```

### 通知系统（Notification System）

```yaml
events:
  - reimbursement_submitted: "通知管理员"
  - reimbursement_reviewed: "通知申请人"
  - payment_executed: "推送交易哈希与链上链接"
integrations:
  telegram:
    api: "Telegram Bot API"
    message_templates:
      - "✅ 报销已提交：{title}，金额 {amount_original}{currency}"
      - "💸 已付款：{amount_usd_equivalent} USD，TxHash: {tx_hash}"
  email:
    provider: "Resend"
    templates:
      - "报销审核通知"
      - "审批结果邮件"
```

## 🧮 数据库模型 (Prisma Schema)

```prisma
model User {
  id              String          @id @default(cuid())
  username        String
  email           String          @unique
  password        String?
  tgAccount       String?
  whatsappAccount String?
  evmAddress      String?
  solanaAddress   String?
  chainAddresses  String?
  role            String          @default("user")
  status          String          @default("pending") // pending, active, suspended
  isApproved      Boolean         @default(false) // 管理员审核状态
  salaryUsdt      Float           @default(0)
  approvedBy      String?         // 审核管理员ID
  approvedAt      DateTime?       // 审核时间
  reimbursements          Reimbursement[] @relation("ReimbursementApplicant")
  reviewedReimbursements  Reimbursement[] @relation("ReimbursementReviewer")
  approvedReimbursements  Reimbursement[] @relation("ReimbursementApprover")
  salaryPayments          SalaryPayment[]
  passwordResetTokens   PasswordResetToken[]
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
}

model Reimbursement {
  id                   String   @id @default(cuid())
  applicantId          String
  title                String
  description          String?
  expenseType          String   @default("other")
  amountOriginal       Float
  currency             String
  exchangeRateToUsd    Float
  amountUsdEquivalent  Float
  exchangeRateSource   String
  exchangeRateTime     DateTime
  isManualRate         Boolean  @default(false)
  convertedBy          String?
  chain                String   @default("evm")
  receiptUrl           String?
  status               String   @default("submitted")
  reviewerId           String?
  approverId           String?
  txHash               String?
  reviewComment        String?
  reviewedAt           DateTime?
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
  applicant            User     @relation("ReimbursementApplicant", fields: [applicantId], references: [id])
  reviewer             User?    @relation("ReimbursementReviewer", fields: [reviewerId], references: [id])
  approver             User?    @relation("ReimbursementApprover", fields: [approverId], references: [id])
}

model SalaryPayment {
  id             String   @id @default(cuid())
  userId         String
  month          String
  amountUsdt     Float
  status         String   @default("pending") // pending, scheduled, paid
  scheduledAt    DateTime?
  paidAt         DateTime?
  transactionHash String?
  notes          String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  user           User     @relation(fields: [userId], references: [id])

  @@unique([userId, month])
}

model PasswordResetToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([expiresAt])
}
```

## ⚙️ 技术栈与依赖

```yaml
frontend:
  framework: Next.js 15
  ui: TailwindCSS + Shadcn/UI
  data_fetching: React Server Actions
backend:
  runtime: Next.js API Routes
  orm: Prisma ORM
  database: PostgreSQL
  exchange_rate: Binance / Coinbase API
  auth: NextAuth.js (Email + JWT)
  storage: Vercel Blob Storage
web3:
  evm: ethers.js
  solana: "@solana/web3.js"
visualization:
  - Chart.js
  - Recharts
notifications:
  - Telegram Bot API
  - Resend Email API
deployment:
  platform: Vercel
  environment: Production + Preview
```

## 🪙 成本与资源预算

```yaml
cost_estimate:
  vercel: "$0–20/month (Hobby Plan)"
  database: "Neon.tech free tier"
  storage: "Vercel Blob 5GB free"
  email_api: "Resend free tier"
  telegram_bot: "Free"
  total_mvp_cost: "< $25 / month"
```

## 🧭 架构总结

```text
Frontend (Next.js + Tailwind)
    ↕
API Routes (User / Reimbursement / Salary / Exchange / Notification)
    ↕
PostgreSQL (Neon / Supabase)
    ↕
Vercel Blob + Binance API + Telegram Bot + Resend Email
```
