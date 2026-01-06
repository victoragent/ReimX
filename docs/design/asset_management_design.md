# 💰 资产管理模块设计文档 (Asset Management Module Design)

## 1. 需求分析 (Requirements Analysis)

### 1.1 背景

目前的记账功能（Bookkeeping/Ledger）主要侧重于**流（Flow）**的记录，即资金的收入和支出。为了更全面地管理财务状况，需要引入**存量（Stock）**即**资产管理**的概念。
用户希望记录初始资产（如固定资产、大额数字资产持仓等），并能够按时间轴记录其**消耗（Depreciation/Consumption）**或**净值更新（Revaluation）**。

### 1.2 核心功能

* **资产建立**: 设定资产名称、初始价值、购入/建立日期、币种等。
* **价值跟踪**:
  * **消耗记录**: 对应资产的折旧或部分使用（例如预付的服务器费用逐月摊销）。
  * **净值更新**: 对应资产的市场价值波动（例如持有的 BTC 涨跌，或固定资产重估）。
* **历史回溯**: 查看资产价值随时间变化的曲线或列表。
* **资产分类**: 区分固定资产、通过预付形式存在的资产、或投资性资产。
* **权限管理**:
  * **普通用户**: 仅管理属于自己的资产（查看、编辑、记录变动）。
  * **管理员**:
    * **全局视图**: 查看全公司所有资产及其变动记录。
    * **管理权限**: 可对任意资产进行增删改查；可修改/删除任意历史变动记录（CRUD）。
    * **个人视图**: 同时保留查看属于自己名下资产的功能。

## 2. 数据库设计 (Database Design)

需新增 `Asset` 和 `AssetRecord` 模型。

```prisma
// 资产状态
enum AssetStatus {
  ACTIVE    // 使用中/持有中
  SOLD      // 已出售
  DEPLETED  // 已耗尽 (消耗类资产)
  WRITTEN_OFF // 核销/报废
}

// 记录类型
enum AssetRecordType {
  INITIAL       // 初始录入
  CONSUMPTION   // 消耗/折旧 (减少价值)
  REVALUATION   // 净值更新 (可能增加或减少)
  ADDITION      // 追加投入 (增加价值)
}

model Asset {
  id              String      @id @default(cuid())
  userId          String      // 资产归属/创建人
  
  name            String
  description     String?
  type            String      // 例如: "FIXED", "CRYPTO", "SUBSCRIPTION"
  
  // 价值信息
  initialValue    Decimal     // 初始价值
  currency        String      // 币种: "USD", "CNY", "USDT", "BTC"
  currentValue    Decimal     // 当前净值 (随 AssetRecord 更新而变动)
  
  // 数量 (可选, 用于 Crypto 或 计件资产)
  quantity        Decimal?    // 例如 1.5 (BTC)
  unit            String?     // 例如 "BTC"
  
  purchaseDate    DateTime    // 购入/启用日期
  
  status          AssetStatus @default(ACTIVE)
  
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  // Relations
  user            User          @relation(fields: [userId], references: [id])
  records         AssetRecord[] // 历史变动记录
}

model AssetRecord {
  id              String          @id @default(cuid())
  assetId         String
  userId          String          // 操作人
  
  type            AssetRecordType
  
  // 变动数值
  amountChange    Decimal         // 变动额 (消耗为负, 增值为正)
  valueAfter      Decimal         // 变动后的资产总价值 (快照)
  
  // 发生时间
  date            DateTime        @default(now())
  
  note            String?         // 备注 (例如: "2023 Q4 折旧" 或 "币价按 $65000 更新")
  
  createdAt       DateTime        @default(now())
  
  // Relations
  asset           Asset           @relation(fields: [assetId], references: [id], onDelete: Cascade)
  user            User            @relation(fields: [userId], references: [id])
}

// Update User model
model User {
  // ... existing fields ...
  assets          Asset[]
  assetRecords    AssetRecord[]
}
```

## 3. API 接口设计 (API Design)

### 3.1 资产管理

#### `POST /api/assets`

* **功能**: 创建新资产。
* **逻辑**: 创建 `Asset` 的同时，自动创建一条 `type: INITIAL` 的 `AssetRecord` 作为初始记录。

#### `GET /api/assets`

* **功能**: 获取资产列表。
* **参数**: `status` (默认 ACTIVE), `type`, `userId` (仅管理员可用).
* **权限逻辑**:
  * **普通用户**: 后端强制过滤 `userId = currentUser.id`，仅返回自己的资产。
  * **管理员**:
    * 若不传 `userId`，返回系统内**所有**资产（公司总视角）。
    * 若传 `userId`，则返回指定用户的资产。

#### `GET /api/assets/[id]`

* **功能**: 获取资产详情（包含最近的 `currentValue`）。
* **权限**: 拥有者或管理员。

#### `PATCH /api/assets/[id]`

* **功能**: 更新资产基础信息 (名称, 描述等)。
* **权限**: 拥有者或管理员。

#### `DELETE /api/assets/[id]`

* **功能**: 删除资产 (或软删除/标记为 WRITTEN_OFF)。
* **权限**: 拥有者或管理员。

### 3.2 资产变动记录

#### `POST /api/assets/[id]/records`

* **功能**: 记录消耗或更新净值。
* **权限**: 拥有者或管理员。
* **Body**:
  * `type`: "CONSUMPTION" | "REVALUATION" | "ADDITION"
  * `amount`: Decimal
  * `date`: 发生日期。
  * `note`: 备注。
* **逻辑**:
    1. 创建 `AssetRecord`。
    2. 更新 `Asset.currentValue`。
    3. 如果价值归零且是消耗型资产，可选更新 `Asset.status = DEPLETED`。

#### `PATCH /api/assets/records/[recordId]`

* **功能**: 修改某条历史变动记录。
* **权限**:
  * **普通用户**: 仅能修改自己创建的记录（且受限于时间或状态，如已归档可能不可改，暂定开放）。
  * **管理员**: 可修改任何记录。
* **逻辑**: 修改历史记录后，需要触发**重新计算**该资产当前的 `currentValue`（或触发审计日志）。

#### `DELETE /api/assets/records/[recordId]`

* **功能**: 删除某条变动记录。
* **权限**: 同上 (管理员可删任意)。
* **逻辑**: 删除后需回滚对 `currentValue` 的影响。

#### `GET /api/assets/[id]/records`

* **功能**: 获取该资产的历史变动记录。
* **权限**: 拥有者或管理员。

## 4. 前端页面设计 (Frontend UI)

### 4.1 资产概览 (`/dashboard/assets`)

* 总资产估值 (折合 USD/CNY)。
* 资产数量。
* **资产卡片/列表**:
  * 展示：名称、当前价值、累计消耗/涨跌幅。
  * 快速操作：[记录消耗]、[更新净值]。

### 4.2 资产详情 (`/dashboard/assets/[id]`)

* **顶部**: 核心指标 (初始值 vs 当前值, ROI/消耗率)。
* **图表**: 价值随时间变化的折线图 (利用 `AssetRecord` 数据)。
* **操作区**:
  * "记录消耗": 弹出 Modal，输入消耗金额和日期。
  * "更新净值": 弹出 Modal，输入最新总价值。
* **历史记录表**: 时间轴倒序展示每一次变动。

## 5. 设计一致性指南 (Design Consistency)

*(遵循 `bookkeeping_feature_design.md` 的规范)*

* **风格**: `bg-white/80`, `backdrop-blur`, `rounded-3xl`.
* **颜色**:
  * 资产增值/正向: `text-emerald-600`
  * 资产消耗/贬值: `text-rose-500` (或 `amber` 表示损耗)
  * 默认文本: `text-slate-900`

## 6. 开发计划 (Implementation Plan)

1. **Schema**: 修改 `schema.prisma` 添加 `Asset` 和 `AssetRecord`。
2. **Server Actions / API**: 实现资产的 CRUD 和记录更新逻辑。
3. **UI Components**:
    * `AssetCard`, `AssetValueChart` (使用 Recharts 或类似库).
    * `RecordTransactionModal`.
4. **Integration**: 接入 Dashboard 侧边栏。
