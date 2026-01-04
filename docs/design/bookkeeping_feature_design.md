# 📒 记账系统设计文档 (Bookkeeping System Design)

## 1. 需求分析 (Requirements Analysis)

### 1.1 背景

当前系统主要处理常规的工资发放（USDT）和报销流程。新的需求要求引入一个灵活的记账功能，用于记录非标准流程产生的财务变动，例如法币工资、资金流转手续费、以及多元化的数字资产（SOL, ETH, BTC 等）。

### 1.2 核心功能

* **多币种/资产支持**：不仅支持法币（CNY, USD等），还需支持多种加密资产（SOL, ETH, BTC）。
* **双角色视图**：
  * **普通用户**：仅能查看和管理自己的记账本。
  * **管理员**：拥有全局上帝视角，查看所有用户的账本（总账）。
* **合并与审核 (Consolidation)**：
  * 用户记录的账目在进入“总账”或被正式认可前，需要经过管理员的审核。
  * 管理员记录的账目默认为已确认状态（或可视作直接记入总账）。
* **记录类型**：
  * 额外费用（法币工资、奖金等）
  * 手续费（Gas fee, Exchange fee）
  * 数字资产持仓/变动记录

## 2. 数据库设计 (Database Design)

基于现有 Prisma Schema，新增 `LedgerEntry` 模型。

```prisma
// Enums for better type safety
enum LedgerEntryType {
  SALARY_FIAT     // 法币工资
  FEE             // 手续费 (Gas, 转换费等)
  DIGITAL_ASSET   // 数字资产 (SOL, ETH, BTC)
  REIMBURSEMENT_EXTRA // 额外报销
  OTHER           // 其他
}

enum LedgerEntryStatus {
  PENDING   // 待审核 (用户提交初始状态)
  APPROVED  // 已审核入账 (管理员提交默认状态, 或用户条目被通过)
  REJECTED  // 已驳回
}

model LedgerEntry {
  id              String            @id @default(cuid())
  userId          String            // 关联用户 (记账人)
  
  // 核心记账字段
  type            LedgerEntryType   @default(OTHER)
  amount          Decimal           // 金额/数量 (使用 Decimal 保证精度)
  currency        String            // 币种单位: "CNY", "USD", "USDT", "ETH", "SOL", "BTC"
  
  // 详情描述
  title           String            // 简短标题
  description     String?           // 详细备注
  transactionDate DateTime          @default(now()) // 实际发生时间
  
  // 凭证与链上信息
  attachmentUrl   String?           // 票据/截图 URL
  txHash          String?           // 链上交易哈希 (如果是 Crypto 类型)
  
  // 状态流转
  status          LedgerEntryStatus @default(PENDING)
  
  // 审核信息
  reviewedBy      String?           // 审核人 ID
  reviewedAt      DateTime?         // 审核时间
  reviewNote      String?           // 审核备注 (驳回理由等)
  
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  // Relations
  user            User              @relation("UserLedgerEntries", fields: [userId], references: [id])
  reviewer        User?             @relation("LedgerReviewer", fields: [reviewedBy], references: [id])
}

// Update User model to include relations
model User {
  // ... existing fields ...
  ledgerEntries   LedgerEntry[]     @relation("UserLedgerEntries")
  reviewedLedgers LedgerEntry[]     @relation("LedgerReviewer")
}
```

## 3. API 接口设计 (API Design)

### 3.1 记账条目管理

#### `POST /api/ledger`

* **功能**：创建新的记账条目。
* **权限**：登录用户。
* **逻辑**：
  * 普通用户创建 -> `status: PENDING`
  * 管理员创建 -> `status: APPROVED` (可选，或前端允许管理员选状态)

#### `GET /api/ledger`

* **功能**：获取记账列表。
* **权限**：登录用户。
* **参数**：
  * `userId`: 筛选特定用户 (普通用户只能传自己的 ID，管理员可传任意或不传看全部)。
  * `status`: 筛选状态 (Pending/Approved)。
  * `startDate`, `endDate`: 时间范围筛选。
* **逻辑**：
  * 普通用户 -> 强制添加 `userId = currentUser.id` 过滤。
  * 管理员 -> 若无 `userId` 参数，返回全局所有条目。

#### `GET /api/ledger/[id]`

* **功能**：获取单条详情。
* **权限**：拥有者或管理员。

#### `PATCH /api/ledger/[id]`

* **功能**：更新条目信息的通用接口（用户修改未审核条目）。

### 3.2 审核管理 (Admin Only)

#### `PATCH /api/admin/ledger/[id]/review`

* **功能**：审核条目 (批准/驳回)。
* **权限**：管理员。
* **Body**：
  * `action`: "APPROVE" | "REJECT"
  * `note`: String (可选备注)

## 4. 前端页面设计 (Frontend UI)

### 4.1 用户端 - "我的记账本" (My Ledger)

* **路径**: `/dashboard/ledger`
* **组件**:
  * **概览卡片**: 显示待审核金额、本月已入账金额。
  * **记账按钮**: 弹出 Modal 或跳转页面，填写金额、币种、类型、上传凭证。
  * **列表表格**: 展示日期、类型、金额、状态 (Badge显示)。

### 4.2 管理员端 - "全局账本" (Global Ledger)

* **路径**: `/admin/ledger`
* **组件**:
  * **统计面板**: 总资产分布 (BTC/ETH/USDT/Fiat) 饼图。
  * **待办提醒**: "X 条新账目待审核"。
  * **全局表格**: 包含用户信息列，支持按用户、状态筛选。
  * **审核操作**: 表格行内或详情页提供 "通过/驳回" 按钮。

## 5. 开发分步计划 (Implementation Plan)

1. **数据库迁移**: 更新 `schema.prisma` 并运行 migration。
2. **API 开发**: 实现 CRUD 和审核接口。
3. **用户UI**: 开发 `/dashboard/ledger` 页面及记账组件。
4. **管理员UI**: 开发 `/admin/ledger` 页面及审核交互。
5. **测试验证**: 验证权限隔离及数据准确性。
