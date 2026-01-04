import type { Reimbursement, SalaryPayment, User } from "@prisma/client";

interface ReimbursementWithApplicant extends Reimbursement {
  applicant: Pick<User, "id" | "username" | "email" | "evmAddress" | "solanaAddress" | "chainAddresses">;
}

interface SalaryPaymentWithUser extends SalaryPayment {
  user: Pick<User, "id" | "username" | "email" | "evmAddress" | "solanaAddress" | "chainAddresses">;
}

export interface SafeWalletItem {
  reimbursementId: string;
  title: string;
  description: string | null;
  amountOriginal: number;
  baseAmount?: number;
  currency: string;
  amountUsdt: number;
  exchangeRateToUsd: number;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  chain: string;
  status?: string;
  transactionHash?: string | null;
}

export interface SafeWalletBatch {
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  evmAddress: string | null;
  solanaAddress: string | null;
  chainAddresses: Record<string, string>;
  chains: string[];
  totalAmountUsdt: number;
  reimbursementIds: string[];
  items: SafeWalletItem[];
}

export interface SafeWalletIssue {
  applicantId: string;
  applicantName: string;
  type: "missing_evm_address" | "missing_chain_address" | "no_items";
  chain?: string;
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

type ChainAddressMap = Record<string, string>;

const CHAIN_ALIASES: Record<string, string> = {
  ethereum: "eth",
  eth: "eth",
  mainnet: "eth",
  bsc: "bsc",
  binance: "bsc",
  polygon: "polygon",
  matic: "polygon",
  arbitrum: "arbitrum",
  arb: "arbitrum",
  base: "base",
  sol: "solana",
  solana: "solana",
  evm: "evm"
};

const EVM_CHAIN_KEYS = new Set([
  "evm",
  "eth",
  "ethereum",
  "bsc",
  "polygon",
  "matic",
  "arbitrum",
  "arb",
  "base",
  "optimism",
  "op",
  "linea"
]);

const normalizeChainKey = (chain?: string | null): string => {
  if (!chain) {
    return "evm";
  }
  const lower = chain.toLowerCase();
  return CHAIN_ALIASES[lower] ?? lower;
};

const isEvmChain = (chain: string) => EVM_CHAIN_KEYS.has(chain);

const extractChainAddressMap = (value: unknown): ChainAddressMap => {
  const result: ChainAddressMap = {};

  if (!value) {
    return result;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return result;
    }
    try {
      return extractChainAddressMap(JSON.parse(trimmed));
    } catch {
      return result;
    }
  }

  const applyEntry = (chain: string, address: unknown) => {
    if (typeof address !== "string") {
      return;
    }
    const normalizedChain = normalizeChainKey(chain);
    const trimmed = address.trim();
    if (trimmed && !result[normalizedChain]) {
      result[normalizedChain] = trimmed;
    }
  };

  if (Array.isArray(value)) {
    for (const entry of value) {
      if (entry && typeof entry === "object") {
        const chain = "chain" in entry ? (entry as { chain?: unknown }).chain : undefined;
        const address = "address" in entry ? (entry as { address?: unknown }).address : undefined;
        if (typeof chain === "string") {
          applyEntry(chain, address);
        }
      }
    }
    return result;
  }

  if (typeof value === "object") {
    for (const [chain, rawAddress] of Object.entries(value as Record<string, unknown>)) {
      if (typeof rawAddress === "string") {
        applyEntry(chain, rawAddress);
      } else if (
        rawAddress &&
        typeof rawAddress === "object" &&
        "address" in rawAddress &&
        typeof (rawAddress as { address?: unknown }).address === "string"
      ) {
        applyEntry(chain, (rawAddress as { address: string }).address);
      }
    }
  }

  return result;
};

const getUserChainAddresses = (
  user: Pick<User, "evmAddress" | "solanaAddress" | "chainAddresses">
): ChainAddressMap => {
  const addresses = extractChainAddressMap(user.chainAddresses);

  if (user.evmAddress) {
    const evm = user.evmAddress.trim();
    if (evm) {
      addresses.evm ??= evm;
    }
  }

  if (user.solanaAddress) {
    const sol = user.solanaAddress.trim();
    if (sol) {
      addresses.solana ??= sol;
    }
  }

  return addresses;
};

const resolveAddressForChain = (
  addresses: ChainAddressMap,
  chain: string,
  fallbacks: { evm?: string | null; solana?: string | null } = {}
): string | null => {
  const normalized = normalizeChainKey(chain);

  if (addresses[normalized]) {
    return addresses[normalized];
  }

  if (normalized === "solana") {
    return addresses.solana ?? fallbacks.solana ?? null;
  }

  if (isEvmChain(normalized)) {
    if (addresses[normalized]) {
      return addresses[normalized];
    }
    if (addresses.evm) {
      return addresses.evm;
    }
    if (addresses.eth) {
      return addresses.eth;
    }
    return fallbacks.evm ?? null;
  }

  return addresses[normalized] ?? fallbacks.evm ?? null;
};

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
    const chain = normalizeChainKey(reimbursement.chain);
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
      applicantEmail: reimbursement.applicant.email,
      chain
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
      if (!existing.chains.includes(item.chain)) {
        existing.chains.push(item.chain);
      }
    } else {
      const chainAddresses = getUserChainAddresses(reimbursement.applicant);
      const resolvedEvmAddress = resolveAddressForChain(chainAddresses, "evm", {
        evm: reimbursement.applicant.evmAddress ?? null
      });
      const resolvedSolanaAddress = resolveAddressForChain(chainAddresses, "solana", {
        solana: reimbursement.applicant.solanaAddress ?? null
      });

      batchesMap.set(applicantKey, {
        applicantId: reimbursement.applicantId,
        applicantName: reimbursement.applicant.username,
        applicantEmail: reimbursement.applicant.email,
        evmAddress: resolvedEvmAddress,
        solanaAddress: resolvedSolanaAddress,
        chainAddresses,
        chains: [item.chain],
        totalAmountUsdt: formatAmount(item.amountUsdt),
        reimbursementIds: [item.reimbursementId],
        items: [item]
      });
    }
  }

  const batches = Array.from(batchesMap.values()).map((batch) => {
    // 排序，方便阅读
    batch.items.sort((a, b) => a.reimbursementId.localeCompare(b.reimbursementId));
    batch.chains = Array.from(new Set(batch.items.map((item) => item.chain)));
    return batch;
  });

  for (const batch of batches) {
    if (batch.items.length === 0) {
      issues.push({
        applicantId: batch.applicantId,
        applicantName: batch.applicantName,
        type: "no_items",
        message: `${batch.applicantName} 没有符合条件的报销单。`
      });
    }

    const chainAddresses = batch.chainAddresses ?? {};
    const fallbacks = {
      evm: batch.evmAddress,
      solana: batch.solanaAddress
    };

    for (const chain of new Set(batch.chains)) {
      const normalizedChain = normalizeChainKey(chain);
      const resolved = resolveAddressForChain(chainAddresses, normalizedChain, fallbacks);

      if (!resolved) {
        const isEvm = isEvmChain(normalizedChain);
        const label = normalizedChain.toUpperCase();
        issues.push({
          applicantId: batch.applicantId,
          applicantName: batch.applicantName,
          type: isEvm ? "missing_evm_address" : "missing_chain_address",
          chain: normalizedChain,
          message: isEvm
            ? `${batch.applicantName} 缺少 EVM 链地址，无法生成 Safe Wallet 交易。`
            : `${batch.applicantName} 缺少 ${label} 链地址，无法生成 Safe Wallet 交易。`
        });
      }
    }
  }

  const transactions = batches
    .map((batch) => {
      const recipient = resolveAddressForChain(batch.chainAddresses, "evm", { evm: batch.evmAddress });

      if (!recipient || batch.totalAmountUsdt <= 0) {
        return null;
      }

      return {
        to: recipient,
        value: formatForPayload(batch.totalAmountUsdt),
        data: "0x",
        description: `ReimX reimbursements for ${batch.applicantName} (${batch.reimbursementIds.length} items)`,
        metadata: {
          applicantId: batch.applicantId,
          reimbursementIds: batch.reimbursementIds
        }
      };
    })
    .filter((transaction): transaction is NonNullable<typeof transaction> => transaction !== null);

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
    amountOriginal: payment.paymentAmountUsdt ?? payment.amountUsdt,
    baseAmount: payment.amountUsdt,
    currency: "USDT",
    amountUsdt: formatAmount(payment.paymentAmountUsdt ?? payment.amountUsdt),
    exchangeRateToUsd: 1,
    applicantId: payment.userId,
    applicantName: payment.user.username,
    applicantEmail: payment.user.email,
    chain: "evm",
    status: payment.status,
    transactionHash: payment.transactionHash
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
      if (!existing.chains.includes(item.chain)) {
        existing.chains.push(item.chain);
      }
    } else {
      const chainAddresses = getUserChainAddresses(payment.user);
      const resolvedEvmAddress = resolveAddressForChain(chainAddresses, "evm", {
        evm: payment.user.evmAddress ?? null
      });

      batchesMap.set(applicantKey, {
        applicantId: payment.userId,
        applicantName: payment.user.username,
        applicantEmail: payment.user.email,
        evmAddress: resolvedEvmAddress,
        solanaAddress: resolveAddressForChain(chainAddresses, "solana", {
          solana: payment.user.solanaAddress ?? null
        }),
        chainAddresses,
        chains: [item.chain],
        totalAmountUsdt: formatAmount(item.amountUsdt),
        reimbursementIds: [item.reimbursementId],
        items: [item]
      });
    }
  }

  const batches = Array.from(batchesMap.values()).map((batch) => {
    batch.items.sort((a, b) => a.reimbursementId.localeCompare(b.reimbursementId));
    batch.chains = Array.from(new Set(batch.items.map((item) => item.chain)));
    return batch;
  });

  for (const batch of batches) {
    const chainAddresses = batch.chainAddresses ?? {};
    const fallbacks = {
      evm: batch.evmAddress,
      solana: batch.solanaAddress
    };

    if (batch.items.length === 0) {
      issues.push({
        applicantId: batch.applicantId,
        applicantName: batch.applicantName,
        type: "no_items",
        message: `${batch.applicantName} 没有符合条件的工资发放记录。`
      });
    }

    for (const chain of batch.chains) {
      const normalizedChain = normalizeChainKey(chain);
      const resolved = resolveAddressForChain(chainAddresses, normalizedChain, fallbacks);
      if (!resolved) {
        const isEvm = isEvmChain(normalizedChain);
        const label = normalizedChain.toUpperCase();
        issues.push({
          applicantId: batch.applicantId,
          applicantName: batch.applicantName,
          type: isEvm ? "missing_evm_address" : "missing_chain_address",
          chain: normalizedChain,
          message: isEvm
            ? `${batch.applicantName} 缺少 EVM 链地址，无法生成 Safe Wallet 交易。`
            : `${batch.applicantName} 缺少 ${label} 链地址，无法生成 Safe Wallet 交易。`
        });
      }
    }
  }

  const transactions = batches
    .map((batch) => {
      const recipient = resolveAddressForChain(batch.chainAddresses, "evm", { evm: batch.evmAddress });
      if (!recipient || batch.totalAmountUsdt <= 0) {
        return null;
      }

      return {
        to: recipient,
        value: formatForPayload(batch.totalAmountUsdt),
        data: "0x",
        description: `ReimX salary for ${batch.applicantName} (${batch.reimbursementIds.length} items)`,
        metadata: {
          applicantId: batch.applicantId,
          reimbursementIds: batch.reimbursementIds
        }
      };
    })
    .filter((transaction): transaction is NonNullable<typeof transaction> => transaction !== null);

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
