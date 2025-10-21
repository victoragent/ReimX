"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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

type DisplaySafeWalletBatch = SafeWalletBatch & { allChainItems: SafeWalletItem[] };

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
  totalReimbursements: number;
  totalBatches: number;
  totalUsdt: number;
  items: SafeWalletItem[];
  batches: SafeWalletBatch[];
  issues: SafeWalletIssue[];
  safewallet: SafeWalletPayload;
}

interface Filters {
  search: string;
  fromDate: string;
  toDate: string;
}

type SelectionState = Record<
  string,
  {
    include: boolean;
    items: Record<string, boolean>;
  }
>;

const defaultFilters: Filters = {
  search: "",
  fromDate: "",
  toDate: ""
};

const chainOptions = [
  { label: "BSC", value: "bsc" },
  { label: "Ethereum", value: "eth" },
  { label: "Arbitrum", value: "arbitrum" },
  { label: "Base", value: "base" }
] as const;

type ChainOptionValue = (typeof chainOptions)[number]["value"];
type TokenType = "USDT" | "USDC";

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

const matchesSelectedChain = (itemChain: string, selected: ChainOptionValue) => {
  const normalizedItem = normalizeChainKey(itemChain);
  const normalizedSelected = normalizeChainKey(selected);
  if (normalizedItem === normalizedSelected) {
    return true;
  }
  if (normalizedItem === "evm" && evmChains.has(normalizedSelected)) {
    return true;
  }
  return false;
};

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

const toStartOfDayIso = (value: string) => `${value}T00:00:00.000Z`;
const toEndOfDayIso = (value: string) => `${value}T23:59:59.999Z`;
const formatForPayload = (amount: number) => Math.round(amount * 1_000_000).toString();

const createSelectionFromBatches = (batches: SafeWalletBatch[]): SelectionState =>
  batches.reduce<SelectionState>((acc, batch) => {
    const itemState = batch.items.reduce<Record<string, boolean>>((itemAcc, item) => {
      itemAcc[item.reimbursementId] = true;
      return itemAcc;
    }, {});
    acc[batch.applicantId] = {
      include: true,
      items: itemState
    };
    return acc;
  }, {});

export default function AdminSafeWalletPage() {
  const pathname = usePathname();
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SafeWalletResponse | null>(null);
  const [selection, setSelection] = useState<SelectionState>({});
  const [copied, setCopied] = useState(false);
  const [tokenType, setTokenType] = useState<TokenType>("USDT");
  const [selectedChain, setSelectedChain] = useState<ChainOptionValue>("eth");

  const buildRequestFilters = () => {
    const payload: Record<string, unknown> = {};

    if (filters.search.trim()) {
      payload.search = filters.search.trim();
    }

    if (filters.fromDate) {
      payload.fromDate = toStartOfDayIso(filters.fromDate);
    }

    if (filters.toDate) {
      payload.toDate = toEndOfDayIso(filters.toDate);
    }

    return payload;
  };

  const fetchBatches = async () => {
    try {
      setLoading(true);
      setError(null);
      setCopied(false);

      const response = await fetch("/api/admin/reimbursements/safewallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          filters: buildRequestFilters()
        })
      });

      const result = await response.json() as SafeWalletResponse & { error?: string };

      if (!response.ok) {
        setError(result.error || "生成 Safe Wallet 数据失败");
        setData(null);
        setSelection({});
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
    fetchBatches().catch((err) => console.error(err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subNavigation = useMemo(
    () => [
      { name: "报销列表", href: "/admin/reimbursements" },
      { name: "Safe Wallet 批付", href: "/admin/reimbursements/safewallet" }
    ],
    []
  );

  const isSubnavActive = (href: string) => {
    if (!pathname) return false;
    return pathname === href;
  };

  const handleInputChange = (field: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setFilters(defaultFilters);
    setData(null);
    setSelection({});
    setError(null);
    setCopied(false);
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

      const batch = data?.batches.find((item) => item.applicantId === applicantId);
      return {
        ...prev,
        [applicantId]: {
          include,
          items:
            batch?.items.reduce<Record<string, boolean>>((acc, item) => {
              acc[item.reimbursementId] = true;
              return acc;
            }, {}) ?? {}
        }
      };
    });
  };

  const handleToggleItem = (applicantId: string, reimbursementId: string, include: boolean) => {
    setSelection((prev) => {
      const existing = prev[applicantId] ?? { include: true, items: {} as Record<string, boolean> };
      const items = { ...existing.items };

      if (!(reimbursementId in items)) {
        const batch = data?.batches.find((item) => item.applicantId === applicantId);
        batch?.items.forEach((candidate) => {
          if (!(candidate.reimbursementId in items)) {
            items[candidate.reimbursementId] = true;
          }
        });
      }

      items[reimbursementId] = include;

      return {
        ...prev,
        [applicantId]: {
          include: existing.include,
          items
        }
      };
    });
  };

  const filteredBatches = useMemo(() => {
    if (!data) return [];

    return data.batches.reduce<DisplaySafeWalletBatch[]>((acc, batch) => {
      const config = selection[batch.applicantId];
      const chainItems = batch.items.filter((item) => matchesSelectedChain(item.chain, selectedChain));

      if (chainItems.length === 0) {
        return acc;
      }

      const includedItems = chainItems.filter((item) => {
        if (!config) return true;
        const includeItem = config.items[item.reimbursementId];
        return includeItem !== false;
      });

      const totalAmountUsdt = Number(
        includedItems.reduce((sum, item) => sum + item.amountUsdt, 0).toFixed(2)
      );

      acc.push({
        ...batch,
        items: includedItems,
        reimbursementIds: includedItems.map((item) => item.reimbursementId),
        totalAmountUsdt,
        allChainItems: chainItems
      });

      return acc;
    }, []);
  }, [data, selection, selectedChain]);

  const activeBatches = useMemo(
    () =>
      filteredBatches.filter((batch) => {
        const config = selection[batch.applicantId];
        return (config ? config.include : true) && batch.items.length > 0;
      }),
    [filteredBatches, selection]
  );

  const filteredIssues = useMemo(() => {
    if (!data) return [];
    return (data.issues ?? []).filter((issue) => {
      const config = selection[issue.applicantId];
      if (config && !config.include) {
        return false;
      }
      if (issue.chain) {
        return matchesSelectedChain(issue.chain, selectedChain);
      }
      return true;
    });
  }, [data, selection, selectedChain]);

  const csvData = useMemo(() => {
    if (!activeBatches.length) {
      return null;
    }

    const csvRows = activeBatches.flatMap((batch) => {
      if (batch.totalAmountUsdt <= 0) {
        return [];
      }

      const receiver = resolveBatchAddress(batch, selectedChain);
      if (!receiver) {
        return [];
      }

      return [
        {
          token_type: "ERC20",
          token_address: tokenAddresses[tokenType][selectedChain],
          receiver,
          amount: batch.totalAmountUsdt.toString(),
          id: "0"
        }
      ];
    });

    return csvRows;
  }, [activeBatches, tokenType, selectedChain]);

  const csvPreview = useMemo(() => {
    if (!csvData || csvData.length === 0) return "";

    const headers = "token_type,token_address,receiver,amount,id";
    const rows = csvData.map(row =>
      `${row.token_type},${row.token_address},${row.receiver},${row.amount},${row.id}`
    );

    return [headers, ...rows].join("\n");
  }, [csvData]);

  const totalReimbursements = activeBatches.reduce(
    (sum, batch) => sum + batch.items.length,
    0
  );
  const totalBatches = activeBatches.length;
  const totalUsdt = activeBatches.reduce((sum, batch) => sum + batch.totalAmountUsdt, 0);
  const hasBatches = filteredBatches.length > 0;
  const totalIssues = filteredIssues.length;

  // 计算实际生成的交易数量（每个收款人一笔交易）
  const actualTransactions = activeBatches.filter(
    (batch) => batch.totalAmountUsdt > 0 && resolveBatchAddress(batch, selectedChain)
  ).length;

  const handleCopyCSV = async () => {
    if (!csvPreview) {
      return;
    }

    try {
      await navigator.clipboard.writeText(csvPreview);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
      setError("复制失败，请手动选择文本复制。");
    }
  };

  const handleDownload = () => {
    if (!csvPreview) {
      return;
    }

    const blob = new Blob([csvPreview], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reimx-payments-ERC20-${selectedChain}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm shadow-slate-200/50 backdrop-blur">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">报销管理 · 批量支付</h1>
              <p className="mt-1 text-slate-600">
                按照审批结果生成 CSV 格式的批量支付文件。支持 USDT/USDC 代币选择，可在导出前手动剔除部分报销单或收款人。
              </p>
            </div>
            <div className="inline-flex overflow-hidden rounded-full border border-slate-200 bg-slate-100 p-1 text-sm">
              {subNavigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-4 py-1.5 font-medium transition ${isSubnavActive(item.href)
                    ? "bg-white/80 text-indigo-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div>
              <span className="font-semibold text-slate-900">{totalReimbursements}</span>
              <span className="ml-1 text-slate-500">条报销记录</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">{actualTransactions}</span>
              <span className="ml-1 text-slate-500">笔实际交易</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">{totalBatches}</span>
              <span className="ml-1 text-slate-500">个收款人</span>
            </div>
            <div>
              <span className="font-semibold text-indigo-600">{totalUsdt.toFixed(2)}</span>
              <span className="ml-1 text-slate-500">{tokenType} ({chainOptions.find(c => c.value === selectedChain)?.label})</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm shadow-slate-200/50 backdrop-blur space-y-6">
        <h2 className="text-lg font-semibold text-slate-900">筛选条件</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="搜索报销标题 / 描述 / 用户"
            value={filters.search}
            onChange={(event) => handleInputChange("search", event.target.value)}
            className="border-slate-200 rounded-md shadow-sm focus:ring-indigo-200 focus:border-indigo-400"
          />
          <select
            value={selectedChain}
            onChange={(event) => setSelectedChain(event.target.value as ChainOptionValue)}
            className="border-slate-200 rounded-md shadow-sm focus:ring-indigo-200 focus:border-indigo-400"
          >
            {chainOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={tokenType}
            onChange={(event) => setTokenType(event.target.value as TokenType)}
            className="border-slate-200 rounded-md shadow-sm focus:ring-indigo-200 focus:border-indigo-400"
          >
            <option value="USDT">USDT</option>
            <option value="USDC">USDC</option>
          </select>
          <input
            type="date"
            value={filters.fromDate}
            onChange={(event) => handleInputChange("fromDate", event.target.value)}
            className="border-slate-200 rounded-md shadow-sm focus:ring-indigo-200 focus:border-indigo-400"
          />
          <input
            type="date"
            value={filters.toDate}
            onChange={(event) => handleInputChange("toDate", event.target.value)}
            className="border-slate-200 rounded-md shadow-sm focus:ring-indigo-200 focus:border-indigo-400"
          />

        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchBatches}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? "生成中..." : "生成批次"}
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-slate-200 text-slate-700 rounded-md hover:bg-slate-50/80"
          >
            重置条件
          </button>
          <span className="text-sm text-slate-500">
            仅包含当前状态为 <span className="font-semibold text-green-600">已批准</span> 的报销单。
          </span>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {hasBatches ? (
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm shadow-slate-200/50 backdrop-blur space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">批次明细</h2>
              <p className="text-sm text-slate-500">
                取消选中即可临时从本次导出中剔除某位收款人或具体报销单，不会影响原始审批记录。
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCopyCSV}
                disabled={!csvPreview}
                className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50"
              >
                {copied ? "已复制" : "复制 CSV"}
              </button>
              <button
                onClick={handleDownload}
                disabled={!csvPreview}
                className="px-4 py-2 border border-indigo-600 text-indigo-600 rounded-md hover:bg-indigo-50 disabled:opacity-50"
              >
                下载 CSV
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {filteredBatches.map((batch) => {
              const config = selection[batch.applicantId];
              const batchIncluded = config ? config.include : true;
              const resolvedAddress = resolveBatchAddress(batch, selectedChain);
              const normalizedSelected = normalizeChainKey(selectedChain);
              const chainLabel =
                chainOptions.find((option) => option.value === selectedChain)?.label ??
                getChainLabel(selectedChain);
              const excludedItems = batch.allChainItems.filter((item) => {
                const includeItem = selection[batch.applicantId]?.items?.[item.reimbursementId];
                return includeItem === false;
              }).length;
              const cardClasses = [
                "rounded-xl",
                "p-5",
                "transition",
                "border",
                resolvedAddress ? "border-slate-200" : "border-red-200"
              ];
              if (!batchIncluded) {
                cardClasses.push("bg-slate-50", "opacity-70");
              }

              return (
                <div key={batch.applicantId} className={cardClasses.join(" ")}>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="space-y-1">
                      <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                        <input
                          type="checkbox"
                          className="rounded border-slate-200 text-indigo-600 focus:ring-indigo-200"
                          checked={batchIncluded}
                          onChange={(event) =>
                            handleToggleBatch(batch.applicantId, event.target.checked)
                          }
                        />
                        包含在导出中
                        {!batchIncluded && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-gray-200 px-2 py-0.5 text-xs text-slate-600">
                            已排除
                          </span>
                        )}
                      </label>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {batch.applicantName}
                        </h3>
                        <span className="text-sm text-slate-500">{batch.applicantEmail}</span>
                      </div>
                      <div className="text-sm text-slate-500">
                        当前链报销单：{batch.items.length}/{batch.allChainItems.length} 笔已纳入 · 审批合计{" "}
                        <span className="font-semibold text-indigo-600">
                          {batch.totalAmountUsdt.toFixed(2)} {tokenType}
                        </span>
                        <span className="text-xs text-slate-400 ml-1">
                          ({chainLabel})
                        </span>
                        <div className="text-xs text-emerald-600 mt-1">
                          ✓ 将合并为单笔交易支付
                        </div>
                      </div>
                      {resolvedAddress ? (
                        <div className="text-xs text-slate-500 space-y-1">
                          <div>
                            收款地址（{chainLabel}）：{" "}
                            <span className="font-mono break-all">{resolvedAddress}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-red-600">
                          缺少 {chainLabel} 链地址，导出前需补充该用户的收款地址。
                        </div>
                      )}
                      {excludedItems > 0 && (
                        <div className="text-xs text-amber-600">
                          已剔除 {excludedItems} 条报销单，该批次导出时不会包含。
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-slate-500">
                      审批号：
                      <span className="font-mono break-all">
                        {batch.reimbursementIds.join(", ")}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-slate-500">包含</th>
                          <th className="px-4 py-2 text-left font-medium text-slate-500">报销单</th>
                          <th className="px-4 py-2 text-left font-medium text-slate-500">
                            原币种金额
                          </th>
                          <th className="px-4 py-2 text-left font-medium text-slate-500">{tokenType}</th>
                          <th className="px-4 py-2 text-left font-medium text-slate-500">说明</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {batch.allChainItems.map((item, index) => {
                          const itemIncluded = config?.items?.[item.reimbursementId] ?? true;
                          const rowClasses = itemIncluded ? "" : "opacity-60";
                          const itemChainLabel = getChainLabel(item.chain);
                          return (
                            <tr key={item.reimbursementId} className={rowClasses}>
                              <td className="px-4 py-2 align-top">
                                <input
                                  type="checkbox"
                                  className="rounded border-slate-200 text-indigo-600 focus:ring-indigo-200"
                                  checked={itemIncluded}
                                  disabled={!batchIncluded}
                                  onChange={(event) =>
                                    handleToggleItem(
                                      batch.applicantId,
                                      item.reimbursementId,
                                      event.target.checked
                                    )
                                  }
                                />
                              </td>
                              <td className="px-4 py-2 align-top">
                                <div className="font-medium text-slate-900">{item.title}</div>
                                <div className="text-xs text-slate-500">
                                  ID: {item.reimbursementId}
                                </div>
                              </td>
                              <td className="px-4 py-2 align-top text-slate-700">
                                {item.amountOriginal.toFixed(2)} {item.currency}
                              </td>
                              <td className="px-4 py-2 align-top text-slate-600">
                                {item.amountUsdt.toFixed(2)} {tokenType}
                                <div className="text-xs text-slate-400">
                                  {itemChainLabel}
                                </div>
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
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-slate-900">CSV 预览 (ERC20 - {chainOptions.find(c => c.value === selectedChain)?.label})</h3>
            </div>
            {csvPreview ? (
              <pre className="max-h-96 overflow-auto rounded-lg bg-slate-900 text-slate-100 text-xs p-4">
                {csvPreview}
              </pre>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-200 p-6 text-sm text-slate-500 text-center">
                当前筛选或手动剔除后没有可导出的支付记录。
              </div>
            )}
          </div>
        </div>
      ) : (
        !loading && (
          <div className="bg-white/80 rounded-lg border border-dashed border-slate-200 p-10 text-center text-slate-500">
            暂无符合筛选条件的已批准报销，请调整筛选项或稍后再试。
          </div>
        )
      )}

      {totalIssues > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-5 space-y-3">
          <h3 className="font-semibold">待处理事项（{totalIssues}）</h3>
          <ul className="space-y-2 text-sm">
            {filteredIssues.map((issue) => (
              <li key={`${issue.applicantId}-${issue.type}`} className="leading-relaxed">
                <span className="font-medium text-slate-900">{issue.applicantName}</span>：{issue.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
