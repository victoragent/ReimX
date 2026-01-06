"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, Calendar as CalendarIcon, Save } from "lucide-react";
import { cn } from "@/lib/utils";

// Global Expense Types matching Reimbursement system
// Global Expense Types
const GLOBAL_EXPENSE_TYPES = [
    { value: "technology", label: "技术 (Technical)" },
    { value: "travel", label: "差旅 (Travel)" },
    { value: "administrative", label: "行政 (Administrative)" },
    { value: "hr", label: "人力 (HR)" },
    { value: "operations", label: "运营 (Operations)" },
    { value: "other", label: "其他 (Other)" },
];

const CURRENCIES = ["CNY", "USD", "HKD", "EUR", "GBP", "JPY", "USDT", "ETH", "BTC", "SOL"];

interface LedgerFormProps {
    onSuccess?: () => void;
    className?: string;
}

export function LedgerForm({ onSuccess, className }: LedgerFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Exchange rate state
    const [quoteLoading, setQuoteLoading] = useState(false);
    const [quoteError, setQuoteError] = useState("");
    const [quote, setQuote] = useState<{
        rate: number;
        source: string;
        fetchedAt: string;
    } | null>(null);

    const [formData, setFormData] = useState({
        type: "other",
        amountOriginal: "",
        amountUsdEquivalent: "",
        currency: "CNY",
        title: "",
        description: "",
        transactionDate: new Date().toISOString().split("T")[0],
        attachmentUrl: "",
        txHash: "",
    });

    // Auto-fetch exchange rate when currency changes or on mount
    useEffect(() => {
        const controller = new AbortController();

        async function fetchRate() {
            if (formData.currency === "USD") {
                setQuote({ rate: 1, source: "system", fetchedAt: new Date().toISOString() });
                return;
            }

            setQuoteLoading(true);
            setQuoteError("");
            setQuote(null);

            try {
                const res = await fetch(`/api/exchange?currency=${formData.currency}`, {
                    signal: controller.signal
                });
                const data = await res.json() as { rate: number; source: string; fetchedAt: string; error?: string };

                if (!res.ok) throw new Error(data.error || "获取汇率失败");

                setQuote({
                    rate: data.rate,
                    source: data.source,
                    fetchedAt: data.fetchedAt
                });
            } catch (err: any) {
                if (err.name !== "AbortError") {
                    setQuoteError(err.message);
                }
            } finally {
                setQuoteLoading(false);
            }
        }

        fetchRate();
        return () => controller.abort();
    }, [formData.currency]);

    // Auto-calculate USD amount when amount or rate changes
    useEffect(() => {
        const amount = Number(formData.amountOriginal);
        if (!amount || isNaN(amount)) {
            setFormData(prev => {
                if (prev.amountUsdEquivalent === "") return prev;
                return { ...prev, amountUsdEquivalent: "" };
            });
            return;
        }

        if (formData.currency === "USD") {
            setFormData(prev => {
                const val = formData.amountOriginal;
                if (prev.amountUsdEquivalent === val) return prev;
                return { ...prev, amountUsdEquivalent: val };
            });
            return;
        }

        if (quote?.rate) {
            const val = amount;
            const usd = (val * quote.rate).toFixed(2);
            setFormData(prev => {
                const usdStr = String(usd);
                if (prev.amountUsdEquivalent === usdStr) return prev;
                return { ...prev, amountUsdEquivalent: usdStr };
            });
        }
    }, [formData.amountOriginal, formData.currency, quote]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const payload = {
                ...formData,
                amountOriginal: Number(formData.amountOriginal),
                amountUsdEquivalent: Number(formData.amountUsdEquivalent),
                // Ensure date is ISO
                transactionDate: new Date(formData.transactionDate).toISOString(),
            };

            const res = await fetch("/api/ledger", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json() as { error?: string };
                throw new Error(data.error || "Failed to create entry");
            }

            router.refresh();
            // Reset form
            setFormData({
                type: "other",
                amountOriginal: "",
                amountUsdEquivalent: "",
                currency: "CNY",
                title: "",
                description: "",
                transactionDate: new Date().toISOString().split("T")[0],
                attachmentUrl: "",
                txHash: "",
            });
            onSuccess?.();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
            {error && (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
                    {error}
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    <label htmlFor="title" className="text-sm font-medium text-black">标题</label>
                    <input
                        id="title"
                        name="title"
                        required
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="例如：购买服务器、10月奖金"
                        className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="type" className="text-sm font-medium text-black">全局费用类型</label>
                    <select
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                    >
                        {GLOBAL_EXPENSE_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label htmlFor="amountOriginal" className="text-sm font-medium text-black">原始金额</label>
                    <div className="flex gap-2">
                        <input
                            id="amountOriginal"
                            name="amountOriginal"
                            type="number"
                            step="0.000001"
                            required
                            value={formData.amountOriginal}
                            onChange={handleChange}
                            placeholder="0.00"
                            className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                        />
                        <select
                            name="currency"
                            value={formData.currency}
                            onChange={handleChange}
                            className="flex h-10 w-24 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                        >
                            {CURRENCIES.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                    <div className="text-xs text-slate-500 min-h-[1.25rem]">
                        {quoteLoading && <span>正在更新汇率...</span>}
                        {quoteError && <span className="text-rose-500">汇率获取失败: {quoteError}</span>}
                        {quote && !quoteLoading && formData.currency !== "USD" && (
                            <span>当前汇率: 1 {formData.currency} ≈ {quote.rate} USD</span>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="amountUsdEquivalent" className="text-sm font-medium text-black">USD 等值 (用于统计)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-400">$</span>
                        <input
                            id="amountUsdEquivalent"
                            name="amountUsdEquivalent"
                            type="number"
                            step="0.01"
                            required
                            value={formData.amountUsdEquivalent}
                            onChange={handleChange}
                            placeholder="0.00"
                            className="flex h-10 w-full rounded-md border border-gray-200 bg-white pl-7 pr-3 py-2 text-sm text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                        />
                    </div>
                    <div className="text-xs text-slate-500 min-h-[1.25rem] mt-1.5">
                        {quoteLoading && <span>正在更新汇率...</span>}
                        {quoteError && <span className="text-rose-500">汇率获取失败: {quoteError}</span>}
                        {quote && !quoteLoading && formData.currency !== "USD" && (
                            <span className="inline-flex items-center gap-1">
                                <span>参考汇率: {quote.rate.toFixed(4)}</span>
                                <span className="text-gray-400">|</span>
                                <span>来源: {quote.source}</span>
                                <span className="text-gray-400">|</span>
                                <span>≈ ${(Number(formData.amountOriginal) * quote.rate).toFixed(2)} USD</span>
                            </span>
                        )}
                        {(!quote || formData.currency === "USD") && (
                            <span>* 可手动调整美元等值金额</span>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="transactionDate" className="text-sm font-medium text-black">日期</label>
                    <input
                        id="transactionDate"
                        name="transactionDate"
                        type="date"
                        required
                        value={formData.transactionDate}
                        onChange={handleChange}
                        className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium text-black">备注</label>
                <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                    className="flex w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    <label htmlFor="attachmentUrl" className="text-sm font-medium text-black">凭证 URL (可选)</label>
                    <input
                        id="attachmentUrl"
                        name="attachmentUrl"
                        value={formData.attachmentUrl}
                        onChange={handleChange}
                        placeholder="https://..."
                        className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="txHash" className="text-sm font-medium text-black">交易哈希 (可选)</label>
                    <input
                        id="txHash"
                        name="txHash"
                        value={formData.txHash}
                        onChange={handleChange}
                        placeholder="0x..."
                        className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                    />
                </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100 mt-8">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-black px-6 text-sm font-medium text-white transition-all hover:bg-gray-800 disabled:opacity-50"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            提交中...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4" />
                            保存记录
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
