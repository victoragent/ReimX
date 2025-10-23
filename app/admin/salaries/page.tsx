"use client";

import { useEffect, useMemo, useState } from "react";

interface SafeWalletItem {
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
  chain: string;
}

interface SafeWalletBatch {
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

interface SafeWalletIssue {
  applicantId: string;
  applicantName: string;
  type: string;
  chain?: string;
  message: string;
}

interface SafeWalletPayload {
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

interface SafeWalletResponse {
  totalPayments: number;
  totalBatches: number;
  totalUsdt: number;
  batches: SafeWalletBatch[];
  items: SafeWalletItem[];
  issues: SafeWalletIssue[];
  safewallet: SafeWalletPayload;
}

interface SelectionState {
  [applicantId: string]: {
    include: boolean;
    items: Record<string, boolean>;
  };
}

const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const chainOptions = [
  { label: "BSC", value: "bsc" },
  { label: "Ethereum", value: "eth" },
  { label: "Arbitrum", value: "arbitrum" },
  { label: "Base", value: "base" }
] as const;

type ChainOptionValue = (typeof chainOptions)[number]["value"];
type TokenType = "USDT" | "USDC";

// 从报销页面复制的链地址解析逻辑
const chainAliasMap: Record<string, string> = {
  ethereum: "eth",
  eth: "eth",
  mainnet: "eth",
  bsc: "bsc",
  binance: "bsc",
  arbitrum: "arbitrum",
  arb: "arbitrum",
  base: "base",
  evm: "evm",
  sol: "solana",
  solana: "solana",
  polygon: "polygon",
  matic: "polygon"
};

const normalizeChainKey = (chain: string): string => {
  const lower = chain.trim().toLowerCase();
  return chainAliasMap[lower] ?? lower;
};

const evmChains = new Set<string>(["evm", "eth", "bsc", "arbitrum", "base", "polygon"]);

const getChainLabel = (chain: string) => {
  const normalized = normalizeChainKey(chain);
  const matched = chainOptions.find((option) => option.value === normalized);
  if (matched) {
    return matched.label;
  }
  if (normalized === "evm") {
    return "EVM 通用";
  }
  if (normalized === "solana") {
    return "Solana";
  }
  return normalized.toUpperCase();
};

const resolveBatchAddress = (batch: SafeWalletBatch, selected: ChainOptionValue): string | null => {
  const normalizedSelected = normalizeChainKey(selected);
  const addresses = batch.chainAddresses ?? {};

  if (addresses[normalizedSelected]) {
    return addresses[normalizedSelected];
  }

  if (normalizedSelected === "solana") {
    return addresses.solana ?? batch.solanaAddress ?? null;
  }

  if (evmChains.has(normalizedSelected)) {
    if (addresses[normalizedSelected]) {
      return addresses[normalizedSelected];
    }
    if (addresses.evm) {
      return addresses.evm;
    }
    if (addresses.eth) {
      return addresses.eth;
    }
    return batch.evmAddress ?? null;
  }

  return batch.evmAddress ?? null;
};

const tokenAddresses: Record<TokenType, Record<ChainOptionValue, string>> = {
  USDT: {
    bsc: "0x55d398326f99059fF775485246999027B3197955", // BSC USDT
    eth: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // Ethereum USDT
    arbitrum: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", // Arbitrum USDT
    base: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb" // Base USDT
  },
  USDC: {
    bsc: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", // BSC USDC
    eth: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // Ethereum USDC
    arbitrum: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // Arbitrum USDC
    base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" // Base USDC
  }
};

const createSelectionFromBatches = (batches: SafeWalletBatch[]): SelectionState =>
  batches.reduce<SelectionState>((acc, batch) => {
    acc[batch.applicantId] = {
      include: true,
      items: batch.items.reduce<Record<string, boolean>>((map, item) => {
        map[item.reimbursementId] = true;
        return map;
      }, {})
    };
    return acc;
  }, {});

export default function AdminSalariesPage() {
  const [month, setMonth] = useState(currentMonth());
  const [statusFilter, setStatusFilter] = useState("pending");
  const [data, setData] = useState<SafeWalletResponse | null>(null);
  const [selection, setSelection] = useState<SelectionState>({});
  const [loading, setLoading] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [transactionHash, setTransactionHash] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [tokenType, setTokenType] = useState<TokenType>("USDT");
  const [selectedChain, setSelectedChain] = useState<ChainOptionValue>("eth");

  const hasBatches = data?.batches && data.batches.length > 0;

  const filteredBatches = useMemo(() => {
    if (!data) return [];

    return data.batches.reduce<SafeWalletBatch[]>((acc, batch) => {
      const config = selection[batch.applicantId];
      if (config && !config.include) {
        return acc;
      }

      const filteredItems = batch.items.filter((item) => {
        if (!config) return true;
        const includeItem = config.items[item.reimbursementId];
        return includeItem !== undefined ? includeItem : true;
      });

      if (filteredItems.length === 0) {
        return acc;
      }

      const totalAmountUsdt = Number(
        filteredItems.reduce((sum, item) => sum + item.amountUsdt, 0).toFixed(2)
      );

      acc.push({
        ...batch,
        items: filteredItems,
        reimbursementIds: filteredItems.map((item) => item.reimbursementId),
        totalAmountUsdt
      });
      return acc;
    }, []);
  }, [data, selection]);

  const filteredIssues = useMemo(() => {
    if (!data) return [];
    return (data.issues ?? []).filter((issue) => {
      const config = selection[issue.applicantId];
      return config ? config.include : true;
    });
  }, [data, selection]);

  const safeWalletPayload = useMemo(() => {
    if (!filteredBatches.length) {
      return null;
    }

    const template = data?.safewallet;

    return {
      version: template?.version ?? "1.0",
      createdAt: new Date().toISOString(),
      token: "USDT",
      transactions: filteredBatches
        .filter((batch) => batch.evmAddress && batch.totalAmountUsdt > 0)
        .map((batch) => ({
          to: batch.evmAddress as string,
          value: Math.round(batch.totalAmountUsdt * 1_000_000).toString(),
          data: "0x",
          description: `ReimX salary for ${batch.applicantName} (${batch.items.length} items)`,
          metadata: {
            applicantId: batch.applicantId,
            reimbursementIds: batch.items.map((item) => item.reimbursementId)
          }
        }))
    } as SafeWalletPayload;
  }, [filteredBatches, data?.safewallet]);

  const transactionsPreview = useMemo(
    () => (safeWalletPayload ? JSON.stringify(safeWalletPayload, null, 2) : ""),
    [safeWalletPayload]
  );

  const totalPayments = filteredBatches.reduce((sum, batch) => sum + batch.items.length, 0);
  const totalBatches = filteredBatches.length;
  const totalUsdt = filteredBatches.reduce((sum, batch) => sum + batch.totalAmountUsdt, 0);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      const response = await fetch("/api/admin/salaries/safewallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          month,
          status: statusFilter === "all" ? "all" : statusFilter
        })
      });

      const result = (await response.json()) as SafeWalletResponse & { error?: string };

      if (!response.ok) {
        setData(null);
        setSelection({});
        setError(result.error || "获取工资发放数据失败");
        return;
      }

      setData(result);
      setSelection(createSelectionFromBatches(result.batches));
    } catch (err) {
      console.error(err);
      setError("网络错误，请稍后重试");
      setData(null);
      setSelection({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData().catch((err) => console.error(err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, statusFilter]);

  const handleSchedule = async () => {
    try {
      setScheduleLoading(true);
      setError(null);
      setMessage(null);

      const response = await fetch("/api/admin/salaries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ month })
      });

      const result = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setError(result.error || "生成工资发放记录失败");
      } else {
        setMessage(result.message || "工资发放记录已生成");
        await fetchData();
      }
    } catch (err) {
      console.error(err);
      setError("网络错误，请稍后重试");
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleToggleBatch = (applicantId: string, include: boolean) => {
    setSelection((prev) => {
      const existing = prev[applicantId];
      if (existing) {
        return {
          ...prev,
          [applicantId]: {
            ...existing,
            include
          }
        };
      }

      return {
        ...prev,
        [applicantId]: {
          include,
          items: {}
        }
      };
    });
  };

  const handleToggleItem = (applicantId: string, reimbursementId: string, include: boolean) => {
    setSelection((prev) => {
      const existing = prev[applicantId] ?? { include: true, items: {} as Record<string, boolean> };
      const items = { ...existing.items, [reimbursementId]: include };

      return {
        ...prev,
        [applicantId]: {
          include: existing.include,
          items
        }
      };
    });
  };

  const selectedSalaryIds = useMemo(() => {
    return filteredBatches.flatMap((batch) => batch.items.map((item) => item.reimbursementId));
  }, [filteredBatches]);

  const handleMarkPaid = async () => {
    if (selectedSalaryIds.length === 0) {
      setError("请选择至少一个工资记录");
      return;
    }

    try {
      setMarkingPaid(true);
      setError(null);
      setMessage(null);

      const response = await fetch("/api/admin/salaries/pay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          salaryPaymentIds: selectedSalaryIds,
          transactionHash: transactionHash || undefined
        })
      });

      const result = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setError(result.error || "更新工资状态失败");
      } else {
        setMessage(result.message || "已标记为已发放");
        setTransactionHash("");
        await fetchData();
      }
    } catch (err) {
      console.error(err);
      setError("网络错误，请稍后重试");
    } finally {
      setMarkingPaid(false);
    }
  };

  const handleCopyPayload = async () => {
    if (!csvPreview) return;
    try {
      await navigator.clipboard.writeText(csvPreview);
      setMessage("CSV 已复制");
    } catch (err) {
      console.error(err);
      setError("复制失败，请手动选择文本");
    }
  };

  const csvData = useMemo(() => {
    if (!filteredBatches.length) {
      return null;
    }

    const csvRows: { token_type: string; token_address: string; receiver: string; amount: string; id: string }[] = [];

    filteredBatches.forEach(batch => {
      const resolvedAddress = resolveBatchAddress(batch, selectedChain);
      if (!resolvedAddress) {
        console.warn(`Skipping batch for ${batch.applicantName} (ID: ${batch.applicantId}) due to missing address for chain ${selectedChain}.`);
        return;
      }

      const tokenAddress = tokenAddresses[tokenType][selectedChain];
      if (!tokenAddress) {
        console.warn(`Skipping batch for ${batch.applicantName} (ID: ${batch.applicantId}) due to missing token address for ${selectedChain} ${tokenType}.`);
        return;
      }

      // 为每个工资记录生成一行CSV
      batch.items.forEach(item => {
        csvRows.push({
          token_type: "ERC20",
          token_address: tokenAddress,
          receiver: resolvedAddress,
          amount: item.amountUsdt.toFixed(2),
          id: item.reimbursementId
        });
      });
    });

    return csvRows;
  }, [filteredBatches, tokenType, selectedChain]);

  const csvPreview = useMemo(() => {
    if (!csvData || csvData.length === 0) return "";

    const headers = "token_type,token_address,receiver,amount,id";
    const rows = csvData.map(row =>
      `${row.token_type},${row.token_address},${row.receiver},${row.amount},${row.id}`
    );

    return [headers, ...rows].join("\n");
  }, [csvData]);

  const handleDownload = () => {
    if (!csvPreview) return;
    const blob = new Blob([csvPreview], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    const chainLabel = getChainLabel(selectedChain);
    link.download = `reimx-payroll-${tokenType}-${chainLabel}-${month}.csv`;
    link.href = url;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading && !data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-slate-200 bg-white/80 px-10 py-12 shadow-lg shadow-slate-200/70 backdrop-blur">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-500" />
          <p className="text-sm font-medium text-slate-600">正在获取工资数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-lg shadow-slate-200/60 backdrop-blur">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.35em] text-indigo-500">Payroll</p>
            <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Safe Wallet 工资中心</h1>
            <p className="max-w-xl text-sm text-slate-600 sm:text-base">
              生成 Safe Wallet 批次、导出 JSON 并追踪发放状态，让链上工资发放透明可控。
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white/80 px-5 py-4 shadow-sm shadow-slate-200/50">
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-slate-500">批次</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{totalBatches}</p>
              <p className="text-xs text-slate-500">待发放收款人</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 px-5 py-4 shadow-sm shadow-slate-200/50">
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-slate-500">工资条</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{totalPayments}</p>
              <p className="text-xs text-slate-500">当前筛选范围</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 px-5 py-4 shadow-sm shadow-slate-200/50">
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-slate-500">{tokenType}</p>
              <p className="mt-2 text-2xl font-semibold text-indigo-600">{totalUsdt.toFixed(2)}</p>
              <p className="text-xs text-slate-500">待发放总额</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 px-5 py-4 shadow-sm shadow-slate-200/50">
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-slate-500">链</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{getChainLabel(selectedChain)}</p>
              <p className="text-xs text-slate-500">当前选择</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm shadow-slate-200/50 backdrop-blur">
        <h2 className="text-lg font-semibold text-slate-900">筛选与操作</h2>
        <div className="grid gap-4 lg:grid-cols-6">
          <div>
            <label className="block text-sm font-medium text-slate-700">结算月份</label>
            <input
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className="mt-1 block w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm shadow-sm shadow-slate-200/50 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">状态</label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="mt-1 block w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm shadow-sm shadow-slate-200/50 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="pending">待发放</option>
              <option value="scheduled">已计划</option>
              <option value="paid">已发放</option>
              <option value="all">全部</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">链</label>
            <select
              value={selectedChain}
              onChange={(event) => setSelectedChain(event.target.value as ChainOptionValue)}
              className="mt-1 block w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm shadow-sm shadow-slate-200/50 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              {chainOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">代币</label>
            <select
              value={tokenType}
              onChange={(event) => setTokenType(event.target.value as TokenType)}
              className="mt-1 block w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm shadow-sm shadow-slate-200/50 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="USDT">USDT</option>
              <option value="USDC">USDC</option>
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Safe Wallet 交易哈希（可选）</label>
            <input
              type="text"
              placeholder="若已在 Safe Wallet 发放，请填写链上交易哈希"
              value={transactionHash}
              onChange={(event) => setTransactionHash(event.target.value)}
              className="mt-1 block w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm shadow-sm shadow-slate-200/50 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <p className="mt-2 text-xs text-slate-500">用于导出后回填记录，便于审计追踪。</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSchedule}
            disabled={scheduleLoading}
            className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-slate-200/50 transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {scheduleLoading ? "生成中..." : `生成 ${month} 工资记录`}
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm shadow-slate-200/50 transition hover:bg-slate-50/80"
          >
            刷新数据
          </button>
          <button
            onClick={handleMarkPaid}
            disabled={markingPaid || selectedSalaryIds.length === 0}
            className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-slate-200/50 transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {markingPaid ? "更新中..." : selectedSalaryIds.length ? `标记 ${selectedSalaryIds.length} 条为已发放` : "标记为已发放"}
          </button>
        </div>
        <div className="text-xs text-slate-500">已选 {selectedSalaryIds.length} 条工资记录。</div>
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>
        )}
        {message && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>
        )}
      </section>

      {hasBatches ? (
        <section className="space-y-8 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm shadow-slate-200/50 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Safe Wallet 批次</h2>
              <p className="text-sm text-slate-500">可按需剔除员工或工资记录，导出 CSV 并在发放完成后同步状态。</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleCopyPayload}
                disabled={!csvPreview}
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-slate-200/50 transition hover:bg-black disabled:opacity-60"
              >
                复制 CSV
              </button>
              <button
                onClick={handleDownload}
                disabled={!csvPreview}
                className="inline-flex items-center justify-center rounded-full border border-indigo-600 bg-white/80 px-4 py-2.5 text-sm font-semibold text-indigo-600 shadow-sm shadow-slate-200/50 transition hover:bg-indigo-50 disabled:opacity-50"
              >
                下载 CSV
              </button>
            </div>
          </div>

          <div className="space-y-8">
            {data?.batches.map((batch) => {
              const config = selection[batch.applicantId];
              const include = config ? config.include : true;
              const excludedItems = batch.items.filter((item) => !(config?.items?.[item.reimbursementId] ?? true)).length;

              return (
                <div
                  key={batch.applicantId}
                  className={`rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm shadow-slate-200/50 transition ${include ? "" : "bg-slate-50 opacity-70"}`}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                        <input
                          type="checkbox"
                          className="rounded border-slate-200 text-indigo-600 focus:ring-indigo-200"
                          checked={include}
                          onChange={(event) => handleToggleBatch(batch.applicantId, event.target.checked)}
                        />
                        包含在导出中
                        {!include && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                            已排除
                          </span>
                        )}
                      </label>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-slate-900">{batch.applicantName}</h3>
                        <span className="text-sm text-slate-500">{batch.applicantEmail}</span>
                      </div>
                      <div className="text-sm text-slate-500">
                        工资条数：{batch.items.length} · 合计
                        <span className="font-semibold text-indigo-600"> {batch.totalAmountUsdt.toFixed(2)} USDT</span>
                      </div>
                      {resolveBatchAddress(batch, selectedChain) ? (
                        <div className="text-xs text-slate-500">
                          {getChainLabel(selectedChain)} 地址：<span className="font-mono">{resolveBatchAddress(batch, selectedChain)}</span>
                        </div>
                      ) : (
                        <div className="text-xs text-rose-600">缺少 {getChainLabel(selectedChain)} 地址，导出前需补充该用户的收款地址。</div>
                      )}
                      {excludedItems > 0 && (
                        <div className="text-xs text-amber-600">已剔除 {excludedItems} 条工资记录。</div>
                      )}
                    </div>
                    <div className="text-sm text-slate-500">
                      关联记录：
                      <span className="font-mono break-all">{batch.reimbursementIds.join(", ")}</span>
                    </div>
                  </div>

                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-slate-500">包含</th>
                          <th className="px-4 py-2 text-left font-medium text-slate-500">工资记录</th>
                          <th className="px-4 py-2 text-left font-medium text-slate-500">USDT</th>
                          <th className="px-4 py-2 text-left font-medium text-slate-500">说明</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {batch.items.map((item) => {
                          const includeItem = config?.items?.[item.reimbursementId] ?? true;
                          return (
                            <tr key={item.reimbursementId}>
                              <td className="px-4 py-2 align-top">
                                <input
                                  type="checkbox"
                                  className="rounded border-slate-200 text-indigo-600 focus:ring-indigo-200"
                                  checked={includeItem}
                                  disabled={!include}
                                  onChange={(event) =>
                                    handleToggleItem(batch.applicantId, item.reimbursementId, event.target.checked)
                                  }
                                />
                              </td>
                              <td className="px-4 py-2 align-top">
                                <div className="font-medium text-slate-900">{item.title}</div>
                                <div className="text-xs text-slate-500">ID: {item.reimbursementId}</div>
                              </td>
                              <td className="px-4 py-2 align-top font-semibold text-indigo-600">
                                {item.amountUsdt.toFixed(2)} USDT
                              </td>
                              <td className="px-4 py-2 align-top text-slate-600">
                                {item.description || "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <h3 className="mb-3 text-lg font-semibold text-slate-900">CSV 预览 (ERC20 - {getChainLabel(selectedChain)})</h3>
            {csvPreview ? (
              <pre className="max-h-96 overflow-auto rounded-3xl bg-slate-900 p-4 text-xs text-slate-100">
                {csvPreview}
              </pre>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                当前筛选或手动剔除后没有可导出的交易。
              </div>
            )}
          </div>
        </section>
      ) : (
        !loading && (
          <section className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-10 text-center text-slate-500 backdrop-blur">
            暂无符合筛选条件的工资记录，请生成或调整筛选条件。
          </section>
        )
      )}

      {filteredIssues.length > 0 && (
        <section className="space-y-3 rounded-3xl border border-amber-200 bg-amber-50/80 p-5 text-amber-800 backdrop-blur">
          <h3 className="font-semibold">待处理事项（{filteredIssues.length}）</h3>
          <ul className="space-y-2 text-sm">
            {filteredIssues.map((issue) => (
              <li key={`${issue.applicantId}-${issue.type}`} className="leading-relaxed">
                <span className="font-medium text-slate-900">{issue.applicantName}</span>：{issue.message}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
