"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface ReimbursementForm {
  title: string;
  description: string;
  amountOriginal: number;
  currency: string;
  chain: "evm" | "solana";
  receiptUrl?: string;
}

export default function ReimbursementsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState<ReimbursementForm>({
    title: "",
    description: "",
    amountOriginal: 0,
    currency: "USD",
    chain: "evm",
    receiptUrl: ""
  });

  const currencies = ["USD", "CNY", "HKD", "EUR", "GBP"];
  const chains = [
    { value: "evm", label: "EVM链 (Ethereum, Polygon, BSC等)" },
    { value: "solana", label: "Solana链" }
  ];

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // 获取当前汇率（这里简化处理，实际应该调用汇率API）
      const exchangeRateToUsd = 1; // 简化处理
      const amountUsdEquivalent = form.amountOriginal * exchangeRateToUsd;

      const response = await fetch("/api/reimbursements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicantId: (session?.user as any)?.id,
          title: form.title,
          description: form.description,
          amountOriginal: form.amountOriginal,
          currency: form.currency,
          exchangeRateToUsd,
          amountUsdEquivalent,
          exchangeRateSource: "manual",
          exchangeRateTime: new Date().toISOString(),
          isManualRate: true,
          convertedBy: "user",
          chain: form.chain,
          receiptUrl: form.receiptUrl || undefined
        }),
      });

      const data = await response.json() as { reimbursement?: any; message?: string; error?: any };

      if (response.ok) {
        setSuccess("报销申请提交成功！");
        setForm({
          title: "",
          description: "",
          amountOriginal: 0,
          currency: "USD",
          chain: "evm",
          receiptUrl: ""
        });
      } else {
        setError(data.error || "提交失败，请重试");
      }
    } catch (err) {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">提交报销申请</h1>
            
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  报销标题 *
                </label>
                <input
                  type="text"
                  id="title"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="例如：差旅费报销"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  详细描述
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="请详细描述报销内容..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                    金额 *
                  </label>
                  <input
                    type="number"
                    id="amount"
                    required
                    min="0"
                    step="0.01"
                    value={form.amountOriginal}
                    onChange={(e) => setForm({ ...form, amountOriginal: parseFloat(e.target.value) || 0 })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                    币种 *
                  </label>
                  <select
                    id="currency"
                    required
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    {currencies.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="chain" className="block text-sm font-medium text-gray-700">
                  支付链 *
                </label>
                <select
                  id="chain"
                  required
                  value={form.chain}
                  onChange={(e) => setForm({ ...form, chain: e.target.value as "evm" | "solana" })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  {chains.map((chain) => (
                    <option key={chain.value} value={chain.value}>
                      {chain.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="receiptUrl" className="block text-sm font-medium text-gray-700">
                  发票/收据链接
                </label>
                <input
                  type="url"
                  id="receiptUrl"
                  value={form.receiptUrl}
                  onChange={(e) => setForm({ ...form, receiptUrl: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="https://example.com/receipt.pdf"
                />
                <p className="mt-1 text-sm text-gray-500">
                  请上传发票或收据到云存储服务，然后在此处提供链接
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loading ? "提交中..." : "提交申请"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
