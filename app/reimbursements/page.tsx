"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
    currencyLabels,
    currencies as supportedCurrencies,
    expenseTypeLabels,
    expenseTypes,
    type ExpenseType
} from "@/lib/utils";

const expenseTypeOptions = expenseTypes.map((type) => ({
    value: type,
    label: expenseTypeLabels[type]
}));

interface ReimbursementForm {
    title: string;
    description: string;
    amountOriginal: number;
    currency: string;
    expenseType: ExpenseType;
    receiptUrl?: string;
}

export default function ReimbursementsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [quoteLoading, setQuoteLoading] = useState(false);
    const [quoteError, setQuoteError] = useState("");
    const [quote, setQuote] = useState<{
        rate: number;
        usdAmount: number;
        source: string;
        fetchedAt: string;
    } | null>(null);

    const [form, setForm] = useState<ReimbursementForm>({
        title: "",
        description: "",
        amountOriginal: 0,
        currency: "USD",
        expenseType: "tech",
        receiptUrl: ""
    });

    const [amountInput, setAmountInput] = useState("");

    const currencyOptions = useMemo(() => {
        const unique = supportedCurrencies.filter(
            (code, index, array) => code !== "RMB" && array.indexOf(code) === index
        );
        return unique.map((code) => ({
            value: code,
            label: currencyLabels[code] ?? code
        }));
    }, []);
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
            const response = await fetch("/api/reimbursements", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: form.title,
                    description: form.description,
                    amountOriginal: form.amountOriginal,
                    currency: form.currency,
                    receiptUrl: form.receiptUrl || undefined,
                    expenseType: form.expenseType
                }),
            });

            const data = await response.json() as { reimbursement?: any; message?: string; error?: any };

            if (response.ok && data.reimbursement?.id) {
                router.push(`/reimbursements/${data.reimbursement.id}`);
                return;
            } else if (response.ok) {
                setSuccess("报销申请提交成功！");
                setForm({
                    title: "",
                    description: "",
                    amountOriginal: 0,
                    currency: "USD",
                    expenseType: "tech",
                    receiptUrl: ""
                });
                setAmountInput("");
            } else {
                // 处理API返回的错误对象
                let errorMessage = "提交失败，请重试";
                if (data.error) {
                    if (typeof data.error === 'string') {
                        errorMessage = data.error;
                    } else if (data.error.formErrors && data.error.formErrors.length > 0) {
                        errorMessage = data.error.formErrors[0];
                    } else if (data.error.fieldErrors) {
                        const fieldErrors = Object.values(data.error.fieldErrors).flat();
                        if (fieldErrors.length > 0) {
                            errorMessage = String(fieldErrors[0]);
                        }
                    }
                }
                setError(errorMessage);
            }
        } catch (err) {
            setError("网络错误，请重试");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const controller = new AbortController();
        let isMounted = true;

        const shouldQuery =
            form.amountOriginal > 0 && Number.isFinite(form.amountOriginal);

        async function fetchQuote() {
            if (!shouldQuery) {
                if (isMounted) {
                    setQuote(null);
                    setQuoteError("");
                }
                return;
            }

            setQuoteLoading(true);
            setQuoteError("");

            try {
                const response = await fetch(
                    `/api/exchange?currency=${encodeURIComponent(form.currency)}`,
                    { signal: controller.signal }
                );

                const data = await response.json() as { rate?: number; source?: string; fetchedAt?: string; error?: string };

                if (!response.ok || !data.rate || !data.source || !data.fetchedAt) {
                    throw new Error(data.error || "获取汇率失败");
                }

                if (isMounted) {
                    const usdAmount = Number(
                        (form.amountOriginal * data.rate).toFixed(2)
                    );
                    setQuote({
                        rate: data.rate,
                        source: data.source,
                        fetchedAt: data.fetchedAt,
                        usdAmount
                    });
                    setQuoteError("");
                }
            } catch (err) {
                if (controller.signal.aborted) return;
                if (isMounted) {
                    setQuote(null);
                    setQuoteError(
                        err instanceof Error ? err.message : "获取汇率失败"
                    );
                }
            } finally {
                if (isMounted) {
                    setQuoteLoading(false);
                }
            }
        }

        fetchQuote();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [form.currency, form.amountOriginal]);

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
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-slate-50 to-slate-100 text-slate-900">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(110%_110%_at_50%_0%,rgba(59,130,246,0.12),rgba(14,165,233,0.08),transparent)]" />
            <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-12 px-6 pb-20 pt-24 sm:px-10">
                <section className="space-y-6 text-center">
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-5 py-2 text-xs font-medium uppercase tracking-[0.3em] text-slate-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                        Reimbursement
                    </span>
                    <div className="space-y-4">
                        <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">提交报销申请</h1>
                        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                            将你的费用明细、凭证与支付链路一次性提交，平台会根据费用类型与币种自动生成审批流程与后续结算指引。
                        </p>
                    </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-lg shadow-slate-200/60 backdrop-blur">
                    <div className="space-y-6">
                        {error && (
                            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
                                {success}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="grid gap-8">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="md:col-span-2">
                                    <label htmlFor="title" className="mb-2 block text-sm font-semibold text-slate-700">
                                        报销标题 *
                                    </label>
                                    <input
                                        type="text"
                                        id="title"
                                        required
                                        value={form.title}
                                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                                        className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                        placeholder="例如：技术团队差旅费用"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label htmlFor="description" className="mb-2 block text-sm font-semibold text-slate-700">
                                        详细描述
                                    </label>
                                    <textarea
                                        id="description"
                                        rows={4}
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                        placeholder="请描述费用背景、审批人建议及其他补充说明。"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label htmlFor="expenseType" className="mb-2 block text-sm font-semibold text-slate-700">
                                        费用类型 *
                                    </label>
                                    <select
                                        id="expenseType"
                                        required
                                        value={form.expenseType}
                                        onChange={(e) => setForm({ ...form, expenseType: e.target.value as ExpenseType })}
                                        className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                    >
                                        {expenseTypeOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="md:col-span-2 grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-start">
                                    <div className="space-y-2">
                                        <label htmlFor="amount" className="block text-sm font-semibold text-slate-700">
                                            金额 *
                                        </label>
                                        <input
                                            type="number"
                                            id="amount"
                                            required
                                            min="0"
                                            step="0.01"
                                            value={amountInput}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setAmountInput(value);
                                                setForm({ ...form, amountOriginal: parseFloat(value) || 0 });
                                            }}
                                            onKeyDown={(e) => {
                                                if ((amountInput === "" || amountInput === "0") && /[0-9]/.test(e.key)) {
                                                    setAmountInput("");
                                                }
                                            }}
                                            onFocus={(e) => {
                                                if (e.target.value === "0") {
                                                    e.target.select();
                                                }
                                            }}
                                            className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                            placeholder="请输入金额"
                                        />
                                        <p className="text-xs text-slate-500">
                                            请输入原始币种金额，我们会自动换算为美元。
                                        </p>
                                        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-2 text-xs text-slate-600">
                                            {quoteLoading && <span>正在更新汇率...</span>}
                                            {!quoteLoading && quote && (
                                                <span>
                                                    ≈ <span className="font-semibold text-slate-900">${quote.usdAmount.toFixed(2)}</span> USD（汇率 {quote.rate.toFixed(4)}，来源 {quote.source}）
                                                </span>
                                            )}
                                            {!quoteLoading && !quote && !quoteError && (
                                                <span>输入金额后将自动显示美元换算结果。</span>
                                            )}
                                            {quoteError && (
                                                <span className="text-rose-500">汇率获取失败：{quoteError}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="currency" className="block text-sm font-semibold text-slate-700">
                                            币种 *
                                        </label>
                                        <select
                                            id="currency"
                                            required
                                            value={form.currency}
                                            onChange={(e) => setForm({ ...form, currency: e.target.value })}
                                            className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                        >
                                            {currencyOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label htmlFor="receiptUrl" className="mb-2 block text-sm font-semibold text-slate-700">
                                        发票/收据链接
                                    </label>
                                    <input
                                        type="url"
                                        id="receiptUrl"
                                        value={form.receiptUrl}
                                        onChange={(e) => setForm({ ...form, receiptUrl: e.target.value })}
                                        className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                        placeholder="https://example.com/receipt.pdf"
                                    />
                                    <p className="mt-2 text-xs text-slate-500">
                                        将票据上传至云存储或链上凭证库，并在此粘贴可访问链接，便于财务团队复核。
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="inline-flex items-center rounded-full border border-slate-300 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="inline-flex items-center rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-black focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-60"
                                >
                                    {loading ? "提交中..." : "提交申请"}
                                </button>
                            </div>
                        </form>
                    </div>
                </section>
            </main>
        </div>
    );
}
