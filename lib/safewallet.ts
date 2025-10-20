import type { Reimbursement, SalaryPayment, User } from "@prisma/client";

interface ReimbursementWithApplicant extends Reimbursement {
  applicant: Pick<User, "id" | "username" | "email" | "evmAddress" | "solanaAddress">;
}

interface SalaryPaymentWithUser extends SalaryPayment {
  user: Pick<User, "id" | "username" | "email" | "evmAddress" | "solanaAddress">;
}

export interface SafeWalletItem {
  reimbursementId: string;
  title: string;
  description: string | null;
  amountOriginal: number;
  currency: string;
  amountUsdt: number;
  exchangeRateToUsd: number;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
}

export interface SafeWalletBatch {
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  evmAddress: string | null;
  solanaAddress: string | null;
  totalAmountUsdt: number;
  reimbursementIds: string[];
  items: SafeWalletItem[];
}

export interface SafeWalletIssue {
  applicantId: string;
  applicantName: string;
  type: "missing_evm_address" | "no_items";
  message: string;
}

export interface SafeWalletPayload {
  version: string;
  createdAt: string;
  token: string;
  transactions: Array<{
    to: string;
    value: string;
    data: string;
    description: string;
    metadata: {
      applicantId: string;
      reimbursementIds: string[];
    };
  }>;
}

export interface SafeWalletAggregation {
  items: SafeWalletItem[];
  batches: SafeWalletBatch[];
  issues: SafeWalletIssue[];
  safewalletPayload: SafeWalletPayload;
}

const USDT_DECIMALS = 6;

const formatAmount = (amount: number, decimals = 2) =>
  Number.isFinite(amount) ? Number(amount.toFixed(decimals)) : 0;

const formatForPayload = (amount: number) => {
  const scaled = Math.round(amount * 10 ** USDT_DECIMALS);
  return scaled.toString();
};

/**
 * 将批准的报销记录整理为 SafeWallet 支付批次。
 * 假设 amountUsdEquivalent 等于 USDT 金额（1 USD ≈ 1 USDT）。
 */
export function aggregateForSafeWallet(reimbursements: ReimbursementWithApplicant[]): SafeWalletAggregation {
  const reimbursementsById = new Map<string, ReimbursementWithApplicant>();

  for (const reimbursement of reimbursements) {
    reimbursementsById.set(reimbursement.id, reimbursement);
  }

  const items: SafeWalletItem[] = reimbursements.map((reimbursement) => {
    const amountUsd =
      typeof reimbursement.amountUsdEquivalent === "number"
        ? reimbursement.amountUsdEquivalent
        : reimbursement.amountOriginal * reimbursement.exchangeRateToUsd;

    const amountUsdt = formatAmount(amountUsd);

    return {
      reimbursementId: reimbursement.id,
      title: reimbursement.title,
      description: reimbursement.description ?? null,
      amountOriginal: reimbursement.amountOriginal,
      currency: reimbursement.currency,
      amountUsdt,
      exchangeRateToUsd: reimbursement.exchangeRateToUsd,
      applicantId: reimbursement.applicantId,
      applicantName: reimbursement.applicant.username,
      applicantEmail: reimbursement.applicant.email
    };
  });

  const batchesMap = new Map<string, SafeWalletBatch>();
  const issues: SafeWalletIssue[] = [];

  for (const item of items) {
    const applicantKey = item.applicantId;
    const existing = batchesMap.get(applicantKey);
    const reimbursement = reimbursementsById.get(item.reimbursementId);

    if (!reimbursement) {
      continue;
    }

    if (existing) {
      existing.totalAmountUsdt = formatAmount(existing.totalAmountUsdt + item.amountUsdt);
      existing.reimbursementIds.push(item.reimbursementId);
      existing.items.push(item);
    } else {
      batchesMap.set(applicantKey, {
        applicantId: reimbursement.applicantId,
        applicantName: reimbursement.applicant.username,
        applicantEmail: reimbursement.applicant.email,
        evmAddress: reimbursement.applicant.evmAddress ?? null,
        solanaAddress: reimbursement.applicant.solanaAddress ?? null,
        totalAmountUsdt: formatAmount(item.amountUsdt),
        reimbursementIds: [item.reimbursementId],
        items: [item]
      });
    }
  }

  const batches = Array.from(batchesMap.values()).map((batch) => {
    // 排序，方便阅读
    batch.items.sort((a, b) => a.reimbursementId.localeCompare(b.reimbursementId));
    return batch;
  });

  for (const batch of batches) {
    if (!batch.evmAddress) {
      issues.push({
        applicantId: batch.applicantId,
        applicantName: batch.applicantName,
        type: "missing_evm_address",
        message: `${batch.applicantName} 缺少 EVM 地址，无法生成 Safe Wallet 交易。`
      });
    }

    if (batch.items.length === 0) {
      issues.push({
        applicantId: batch.applicantId,
        applicantName: batch.applicantName,
        type: "no_items",
        message: `${batch.applicantName} 没有符合条件的报销单。`
      });
    }
  }

  const transactions = batches
    .filter((batch) => batch.evmAddress && batch.totalAmountUsdt > 0)
    .map((batch) => ({
      to: batch.evmAddress as string,
      value: formatForPayload(batch.totalAmountUsdt),
      data: "0x",
      description: `ReimX reimbursements for ${batch.applicantName} (${batch.reimbursementIds.length} items)`,
      metadata: {
        applicantId: batch.applicantId,
        reimbursementIds: batch.reimbursementIds
      }
    }));

  const safewalletPayload: SafeWalletPayload = {
    version: "1.0",
    createdAt: new Date().toISOString(),
    token: "USDT",
    transactions
  };

  return {
    items,
    batches,
    issues,
    safewalletPayload
  };
}

export function aggregateSalariesForSafeWallet(payments: SalaryPaymentWithUser[]): SafeWalletAggregation {
  const paymentsById = new Map<string, SalaryPaymentWithUser>();

  for (const payment of payments) {
    paymentsById.set(payment.id, payment);
  }

  const items: SafeWalletItem[] = payments.map((payment) => ({
    reimbursementId: payment.id,
    title: `工资发放 ${payment.month}`,
    description: payment.notes ?? null,
    amountOriginal: payment.amountUsdt,
    currency: "USDT",
    amountUsdt: formatAmount(payment.amountUsdt),
    exchangeRateToUsd: 1,
    applicantId: payment.userId,
    applicantName: payment.user.username,
    applicantEmail: payment.user.email
  }));

  const batchesMap = new Map<string, SafeWalletBatch>();
  const issues: SafeWalletIssue[] = [];

  for (const item of items) {
    const applicantKey = item.applicantId;
    const existing = batchesMap.get(applicantKey);
    const payment = paymentsById.get(item.reimbursementId);

    if (!payment) {
      continue;
    }

    if (existing) {
      existing.totalAmountUsdt = formatAmount(existing.totalAmountUsdt + item.amountUsdt);
      existing.reimbursementIds.push(item.reimbursementId);
      existing.items.push(item);
    } else {
      batchesMap.set(applicantKey, {
        applicantId: payment.userId,
        applicantName: payment.user.username,
        applicantEmail: payment.user.email,
        evmAddress: payment.user.evmAddress ?? null,
        solanaAddress: payment.user.solanaAddress ?? null,
        totalAmountUsdt: formatAmount(item.amountUsdt),
        reimbursementIds: [item.reimbursementId],
        items: [item]
      });
    }
  }

  const batches = Array.from(batchesMap.values()).map((batch) => {
    batch.items.sort((a, b) => a.reimbursementId.localeCompare(b.reimbursementId));
    return batch;
  });

  for (const batch of batches) {
    if (!batch.evmAddress) {
      issues.push({
        applicantId: batch.applicantId,
        applicantName: batch.applicantName,
        type: "missing_evm_address",
        message: `${batch.applicantName} 缺少 EVM 地址，无法生成 Safe Wallet 交易。`
      });
    }

    if (batch.items.length === 0) {
      issues.push({
        applicantId: batch.applicantId,
        applicantName: batch.applicantName,
        type: "no_items",
        message: `${batch.applicantName} 没有符合条件的工资发放记录。`
      });
    }
  }

  const transactions = batches
    .filter((batch) => batch.evmAddress && batch.totalAmountUsdt > 0)
    .map((batch) => ({
      to: batch.evmAddress as string,
      value: formatForPayload(batch.totalAmountUsdt),
      data: "0x",
      description: `ReimX salary for ${batch.applicantName} (${batch.reimbursementIds.length} items)`,
      metadata: {
        applicantId: batch.applicantId,
        reimbursementIds: batch.reimbursementIds
      }
    }));

  const safewalletPayload: SafeWalletPayload = {
    version: "1.0",
    createdAt: new Date().toISOString(),
    token: "USDT",
    transactions
  };

  return {
    items,
    batches,
    issues,
    safewalletPayload
  };
}
