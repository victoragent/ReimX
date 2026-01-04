# ReimX Design & Architecture Overview

## 1. Project Vision

ReimX is a "Web3 Financial Operating System" designed to bridge traditional corporate finance with crypto-native workflows. It solves the problem of managing fiat-denominated expenses in organizations that pay primarily in crypto (e.g., DAOs, Web3 startups).

**Core Philosophy:** "Engineer your finance." Treat financial flows (reimbursements, payroll) as automated pipelines with strict types, audit trails, and batch processing.

## 2. Core Features

### A. Reimbursement Automation

* **Multi-Currency Input:** Employees can submit expenses in various currencies (Fiat like CNY, USD, EUR; Crypto like ETH, USDT).
* **Auto-Conversion:** The system automatically fetches real-time exchange rates (via `lib/exchange.ts`) at the time of submission to lock in a USD-equivalent value.
* **Approval Workflow:**
    1. **Submission:** User submits details + receipt proof.
    2. **Approval:** Admins review and approve/reject.
    3. **Payment:** Approved items are queued for batch payment.
    4. **Reconciliation:** Items are marked as "Reimbursed" after payment.

### B. Safe Wallet Integration (The "Killer Feature")

Instead of performing hundreds of individual on-chain transactions, ReimX aggregates payments:

* **Batching Logic (`lib/safewallet.ts`):** Groups approved reimbursements by user and blockchain network.
* **Payload Generation:** Generates a structured JSON file compatible with Safe (Gnosis Safe) Transaction Builder.
* **Execution:** Admins import this file into Safe to execute dozens of payouts in a single multi-sig transaction.

### C. Payroll Center

* Supports monthly USDT salary management.
* Generates "salary slips" and integrates them into the same Safe Wallet batch payment flow as reimbursements.

## 3. Technical Architecture

### Stack

* **Framework:** Next.js 14 (App Router)
* **Language:** TypeScript
* **Database:** PostgreSQL (via Prisma ORM)
* **Authentication:** NextAuth.js (Email/Password)
* **Styling:** Tailwind CSS + Shadcn/UI

### Data Model (`prisma/schema.prisma`)

* **User:** Stores Profile + Crypto Addresses (EVM/Solana) + Role (Admin/User).
* **Reimbursement:** The central ledger entity. Key fields:
  * `amountOriginal` / `currency`: The actual expense.
  * `amountUsdEquivalent` / `exchangeRateToUsd`: The standardized value.
  * `status`: State machine (`submitted`, `approved`, `reimbursed`).
  * `reimbursementUrl`: Link to on-chain tx or payment proof.
* **SalaryPayment:** Monthly recurring payment records.

### Key Workflows

#### 1. Submission Flow (`app/api/reimbursements/route.ts`)

1. User posts expense details.
2. Server fetches real-time FX rate.
3. Calculates `USD Equivalent`.
4. Saves record with status `submitted`.
5. Triggers notification (Telegram/Email).

#### 2. Payment Flow

1. Admin selects multiple `approved` items.
2. System calls `aggregateForSafeWallet`.
3. Groups items by User -> Chain (EVM/Solana).
4. Checks for missing addresses (Warning system).
5. Outputs JSON for Safe Wallet.

## 4. Directory Structure

* `app/api`: Backend API routes (REST).
* `lib`: Core logic (Exchange rates, Safe Wallet batching, Utils).
* `prisma`: DB Schema.
* `components`: UI implementation.
* `scripts`: DevOps and setup scripts.
