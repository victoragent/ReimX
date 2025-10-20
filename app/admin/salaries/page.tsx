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
    };
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

      const result = await response.json() as SafeWalletResponse & { error?: string };

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

      const result = await response.json() as { error?: string; message?: string };

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

      const result = await response.json() as { error?: string; message?: string };

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
    if (!transactionsPreview) return;
    try {
      await navigator.clipboard.writeText(transactionsPreview);
      setMessage("Safe Wallet JSON 已复制");
    } catch (err) {
      console.error(err);
      setError("复制失败，请手动选择文本");
    }
  };

  const handleDownload = () => {
    if (!transactionsPreview) return;
    const blob = new Blob([transactionsPreview], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reimx-payroll-${month}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">工资管理</h1>
            <p className="mt-1 text-gray-600">
              管理员工固定工资，按月生成 Safe Wallet 批付，并追踪发放状态。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div>
              <span className="font-semibold text-gray-900">{totalPayments}</span>
              <span className="ml-1 text-gray-500">条工资记录</span>
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
        <h2 className="text-lg font-semibold text-gray-900">筛选与操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">结算月份</label>
            <input
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">状态</label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="pending">待发放</option>
              <option value="scheduled">已计划</option>
              <option value="paid">已发放</option>
              <option value="all">全部</option>
            </select>
          </div>
          <div className="md:col-span-2 flex items-end gap-3">
            <button
              onClick={handleSchedule}
              disabled={scheduleLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-60"
            >
              {scheduleLoading ? "生成中..." : `生成 ${month} 工资记录`}
            </button>
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              刷新数据
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        )}
      </div>

      {hasBatches ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Safe Wallet 批次</h2>
              <p className="text-sm text-gray-500">
                可按需剔除部分员工或工资记录，导出 Safe Wallet JSON 并在发放后标记为已支付。
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleCopyPayload}
                disabled={!transactionsPreview}
                className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50"
              >
                复制 JSON
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
              const include = config ? config.include : true;
              const excludedItems = batch.items.filter(
                (item) => !(config?.items?.[item.reimbursementId] ?? true)
              ).length;

              return (
                <div
                  key={batch.applicantId}
                  className={`border border-gray-200 rounded-xl p-5 transition ${include ? "" : "bg-gray-50 opacity-70"}`}
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="space-y-1">
                      <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          checked={include}
                          onChange={(event) => handleToggleBatch(batch.applicantId, event.target.checked)}
                        />
                        包含在导出中
                        {!include && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
                            已排除
                          </span>
                        )}
                      </label>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">{batch.applicantName}</h3>
                        <span className="text-sm text-gray-500">{batch.applicantEmail}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        工资条数：{batch.items.length} · 合计
                        <span className="font-semibold text-indigo-600"> {batch.totalAmountUsdt.toFixed(2)} USDT</span>
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
                          已剔除 {excludedItems} 条工资记录。
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      关联记录：
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
                          <th className="px-4 py-2 text-left font-medium text-gray-500">工资记录</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-500">USDT</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-500">说明</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {batch.items.map((item) => {
                          const includeItem = config?.items?.[item.reimbursementId] ?? true;
                          return (
                            <tr key={item.reimbursementId}>
                              <td className="px-4 py-2 align-top">
                                <input
                                  type="checkbox"
                                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                  checked={includeItem}
                                  disabled={!include}
                                  onChange={(event) =>
                                    handleToggleItem(batch.applicantId, item.reimbursementId, event.target.checked)
                                  }
                                />
                              </td>
                              <td className="px-4 py-2 align-top">
                                <div className="font-medium text-gray-900">{item.title}</div>
                                <div className="text-xs text-gray-500">ID: {item.reimbursementId}</div>
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

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="可选：记录 Safe Wallet 交易哈希"
                value={transactionHash}
                onChange={(event) => setTransactionHash(event.target.value)}
                className="w-full md:w-80 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                onClick={handleMarkPaid}
                disabled={markingPaid || selectedSalaryIds.length === 0}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
              >
                {markingPaid ? "更新中..." : "标记为已发放"}
              </button>
            </div>
            <div className="text-sm text-gray-500">
              选中 {selectedSalaryIds.length} 条工资记录。
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Safe Wallet JSON</h3>
            {transactionsPreview ? (
              <pre className="max-h-96 overflow-auto rounded-lg bg-slate-900 text-slate-100 text-xs p-4">
                {transactionsPreview}
              </pre>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 p-6 text-sm text-gray-500 text-center">
                当前筛选或手动剔除后没有可导出的交易。
              </div>
            )}
          </div>
        </div>
      ) : (
        !loading && (
          <div className="bg-white rounded-lg border border-dashed border-gray-300 p-10 text-center text-gray-500">
            暂无符合筛选条件的工资记录，请生成或调整筛选条件。
          </div>
        )
      )}

      {filteredIssues.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-5 space-y-3">
          <h3 className="font-semibold">待处理事项（{filteredIssues.length}）</h3>
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
