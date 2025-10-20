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
}

interface SafeWalletBatch {
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  evmAddress: string | null;
  solanaAddress: string | null;
  totalAmountUsdt: number;
  reimbursementIds: string[];
  items: SafeWalletItem[];
}

interface SafeWalletIssue {
  applicantId: string;
  applicantName: string;
  type: string;
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
  currency: string;
  fromDate: string;
  toDate: string;
  minAmountUsdt: string;
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
  currency: "",
  fromDate: "",
  toDate: "",
  minAmountUsdt: ""
};

const currencyOptions = [
  { label: "所有币种", value: "" },
  { label: "USD", value: "USD" },
  { label: "RMB", value: "RMB" },
  { label: "HKD", value: "HKD" },
  { label: "ETH", value: "ETH" },
  { label: "SOL", value: "SOL" }
];

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

  const buildRequestFilters = () => {
    const payload: Record<string, unknown> = {};

    if (filters.search.trim()) {
      payload.search = filters.search.trim();
    }

    if (filters.currency) {
      payload.currency = filters.currency;
    }

    if (filters.fromDate) {
      payload.fromDate = toStartOfDayIso(filters.fromDate);
    }

    if (filters.toDate) {
      payload.toDate = toEndOfDayIso(filters.toDate);
    }

    if (filters.minAmountUsdt) {
      const parsed = Number(filters.minAmountUsdt);
      if (!Number.isNaN(parsed) && parsed >= 0) {
        payload.minAmountUsdt = parsed;
      }
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

    const version = data?.safewallet?.version ?? "1.0";
    const token = data?.safewallet?.token ?? "USDT";

    return {
      version,
      createdAt: new Date().toISOString(),
      token,
      transactions: filteredBatches
        .filter((batch) => batch.evmAddress && batch.totalAmountUsdt > 0)
        .map((batch) => ({
          to: batch.evmAddress as string,
          value: formatForPayload(batch.totalAmountUsdt),
          data: "0x",
          description: `ReimX reimbursements for ${batch.applicantName} (${batch.items.length} items)`,
          metadata: {
            applicantId: batch.applicantId,
            reimbursementIds: batch.items.map((item) => item.reimbursementId)
          }
        }))
    };
  }, [filteredBatches, data?.safewallet?.token, data?.safewallet?.version]);

  const transactionsPreview = useMemo(
    () => (safeWalletPayload ? JSON.stringify(safeWalletPayload, null, 2) : ""),
    [safeWalletPayload]
  );

  const totalReimbursements = filteredBatches.reduce(
    (sum, batch) => sum + batch.items.length,
    0
  );
  const totalBatches = filteredBatches.length;
  const totalUsdt = filteredBatches.reduce((sum, batch) => sum + batch.totalAmountUsdt, 0);
  const hasBatches = totalBatches > 0;
  const totalIssues = filteredIssues.length;

  const handleCopyPayload = async () => {
    if (!transactionsPreview) {
      return;
    }

    try {
      await navigator.clipboard.writeText(transactionsPreview);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
      setError("复制失败，请手动选择文本复制。");
    }
  };

  const handleDownload = () => {
    if (!transactionsPreview) {
      return;
    }

    const blob = new Blob([transactionsPreview], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reimx-safewallet-${new Date().toISOString()}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">报销管理 · Safe Wallet 批付</h1>
              <p className="mt-1 text-gray-600">
                按照审批结果整合已批准报销，生成 USDT 计价的 Safe Wallet 批量交易。可在导出前手动剔除部分报销单或收款人。
              </p>
            </div>
            <div className="inline-flex overflow-hidden rounded-full border border-gray-200 bg-gray-100 p-1 text-sm">
              {subNavigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-4 py-1.5 font-medium transition ${
                    isSubnavActive(item.href)
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div>
              <span className="font-semibold text-gray-900">{totalReimbursements}</span>
              <span className="ml-1 text-gray-500">条报销记录</span>
            </div>
            <div>
              <span className="font-semibold text-gray-900">{totalBatches}</span>
              <span className="ml-1 text-gray-500">个收款人批次</span>
            </div>
            <div>
              <span className="font-semibold text-indigo-600">{totalUsdt.toFixed(2)}</span>
              <span className="ml-1 text-gray-500">USDT</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">筛选条件</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="搜索报销标题 / 描述 / 用户"
            value={filters.search}
            onChange={(event) => handleInputChange("search", event.target.value)}
            className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
          <select
            value={filters.currency}
            onChange={(event) => handleInputChange("currency", event.target.value)}
            className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            {currencyOptions.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={filters.fromDate}
            onChange={(event) => handleInputChange("fromDate", event.target.value)}
            className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
          <input
            type="date"
            value={filters.toDate}
            onChange={(event) => handleInputChange("toDate", event.target.value)}
            className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="最小 USDT 金额"
            value={filters.minAmountUsdt}
            onChange={(event) => handleInputChange("minAmountUsdt", event.target.value)}
            className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
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
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            重置条件
          </button>
          <span className="text-sm text-gray-500">
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">批次明细</h2>
              <p className="text-sm text-gray-500">
                取消选中即可临时从本次导出中剔除某位收款人或具体报销单，不会影响原始审批记录。
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCopyPayload}
                disabled={!transactionsPreview}
                className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50"
              >
                {copied ? "已复制" : "复制 JSON"}
              </button>
              <button
                onClick={handleDownload}
                disabled={!transactionsPreview}
                className="px-4 py-2 border border-indigo-600 text-indigo-600 rounded-md hover:bg-indigo-50 disabled:opacity-50"
              >
                下载 JSON
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {data?.batches.map((batch) => {
              const config = selection[batch.applicantId];
              const batchIncluded = config ? config.include : true;
              const excludedItems = batch.items.filter(
                (item) => !(config?.items?.[item.reimbursementId] ?? true)
              ).length;

              return (
                <div
                  key={batch.applicantId}
                  className={`border border-gray-200 rounded-xl p-5 transition ${
                    batchIncluded ? "" : "bg-gray-50 opacity-70"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="space-y-1">
                      <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          checked={batchIncluded}
                          onChange={(event) =>
                            handleToggleBatch(batch.applicantId, event.target.checked)
                          }
                        />
                        包含在导出中
                        {!batchIncluded && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
                            已排除
                          </span>
                        )}
                      </label>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {batch.applicantName}
                        </h3>
                        <span className="text-sm text-gray-500">{batch.applicantEmail}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        原始批次数量：{batch.items.length} 笔 · 审批合计{" "}
                        <span className="font-semibold text-indigo-600">
                          {batch.totalAmountUsdt.toFixed(2)} USDT
                        </span>
                      </div>
                      {batch.evmAddress ? (
                        <div className="text-xs text-gray-500">
                          EVM 地址：<span className="font-mono">{batch.evmAddress}</span>
                        </div>
                      ) : (
                        <div className="text-xs text-red-600">
                          缺少 EVM 地址，导出前需补充该用户的收款地址。
                        </div>
                      )}
                      {excludedItems > 0 && (
                        <div className="text-xs text-amber-600">
                          已剔除 {excludedItems} 条报销单，该批次导出时不会包含。
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      审批号：
                      <span className="font-mono break-all">
                        {batch.reimbursementIds.join(", ")}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-gray-500">包含</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-500">报销单</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-500">
                            原币种金额
                          </th>
                          <th className="px-4 py-2 text-left font-medium text-gray-500">USDT</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-500">说明</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {batch.items.map((item) => {
                          const itemIncluded =
                            config?.items?.[item.reimbursementId] ?? true;
                          return (
                            <tr key={item.reimbursementId}>
                              <td className="px-4 py-2 align-top">
                                <input
                                  type="checkbox"
                                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
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
                                <div className="font-medium text-gray-900">{item.title}</div>
                                <div className="text-xs text-gray-500">
                                  ID: {item.reimbursementId}
                                </div>
                              </td>
                              <td className="px-4 py-2 align-top text-gray-700">
                                {item.amountOriginal.toFixed(2)} {item.currency}
                              </td>
                              <td className="px-4 py-2 align-top text-indigo-600 font-semibold">
                                {item.amountUsdt.toFixed(2)} USDT
                              </td>
                              <td className="px-4 py-2 align-top text-gray-600">
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
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Safe Wallet JSON</h3>
            {transactionsPreview ? (
              <pre className="max-h-96 overflow-auto rounded-lg bg-slate-900 text-slate-100 text-xs p-4">
                {transactionsPreview}
              </pre>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 p-6 text-sm text-gray-500 text-center">
                当前筛选或手动剔除后没有可导出的 Safe Wallet 交易。
              </div>
            )}
          </div>
        </div>
      ) : (
        !loading && (
          <div className="bg-white rounded-lg border border-dashed border-gray-300 p-10 text-center text-gray-500">
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
                <span className="font-medium text-gray-900">{issue.applicantName}</span>：{issue.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
