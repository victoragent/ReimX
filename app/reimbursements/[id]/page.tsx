"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { expenseTypeLabels, type ExpenseType } from "@/lib/utils";

interface ReimbursementDetail {
    id: string;
    title: string;
    description?: string;
    amountOriginal: number;
    currency: string;
    amountUsdEquivalent: number;
    exchangeRateToUsd: number;
    exchangeRateSource: string;
    exchangeRateTime: string;
    isManualRate: boolean;
    convertedBy?: string;
    expenseType: ExpenseType;
    receiptUrl?: string;
    status: string;
    reviewerId?: string;
    approverId?: string;
    txHash?: string;
    reimbursementUrl?: string;
    createdAt: string;
    updatedAt: string;
    applicant: {
        id: string;
        username: string;
        email: string;
    };
    reviewer?: {
        id: string;
        username: string;
        email: string;
    };
    approver?: {
        id: string;
        username: string;
        email: string;
    };
}

export default function ReimbursementDetailPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const [reimbursement, setReimbursement] = useState<ReimbursementDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
            return;
        }

        if (status === "authenticated" && params.id) {
            fetchReimbursementDetail();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, router, params.id]);

    const fetchReimbursementDetail = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/reimbursements/${params.id}`);
            const data = await response.json() as { reimbursement?: ReimbursementDetail; error?: string };

            if (response.ok) {
                setReimbursement(data.reimbursement!);
            } else {
                setError(data.error || "获取报销详情失败");
            }
        } catch (err) {
            setError("网络错误，请重试");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "submitted":
                return "bg-amber-100 text-amber-800";
            case "approved":
                return "bg-emerald-100 text-emerald-700";
            case "rejected":
                return "bg-rose-100 text-rose-700";
            case "reimbursed":
            case "paid":
                return "bg-sky-100 text-sky-700";
            default:
                return "bg-slate-100 text-slate-700";
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case "submitted":
                return "待审核";
            case "approved":
                return "已批准";
            case "rejected":
                return "已拒绝";
            case "reimbursed":
            case "paid":
                return "已支付";
            default:
                return status;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString("zh-CN");
    };

    if (status === "loading" || loading) {
        return (
            <div className="relative min-h-screen overflow-y-auto bg-gradient-to-br from-white via-slate-50 to-slate-100 text-slate-900">
                <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_120%_at_50%_0%,rgba(59,130,246,0.14),rgba(14,165,233,0.08),transparent)]" />
                <div className="flex min-h-screen items-center justify-center">
                    <div className="flex flex-col items-center gap-4 rounded-3xl border border-slate-200 bg-white/80 px-12 py-10 shadow-lg shadow-slate-200/60 backdrop-blur">
                        <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-500" />
                        <p className="text-sm font-medium text-slate-600">正在载入报销详情...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (status === "unauthenticated") {
        return null;
    }

    if (error) {
        return (
            <div className="relative min-h-screen overflow-y-auto bg-gradient-to-br from-white via-slate-50 to-slate-100 text-slate-900">
                <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_120%_at_50%_0%,rgba(59,130,246,0.14),rgba(14,165,233,0.08),transparent)]" />
                <div className="flex min-h-screen items-center justify-center px-6">
                    <div className="w-full max-w-md rounded-3xl border border-rose-200 bg-white/85 p-8 text-center shadow-xl shadow-rose-100/60 backdrop-blur">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-3xl">⚠️</div>
                        <h2 className="mt-4 text-xl font-semibold text-slate-900">加载失败</h2>
                        <p className="mt-2 text-sm text-slate-500">{error}</p>
                        <button
                            onClick={() => router.back()}
                            className="mt-6 inline-flex items-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-black"
                        >
                            返回
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!reimbursement) {
        return (
            <div className="relative min-h-screen overflow-y-auto bg-gradient-to-br from-white via-slate-50 to-slate-100 text-slate-900">
                <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_120%_at_50%_0%,rgba(79,70,229,0.14),rgba(14,165,233,0.08),transparent)]" />
                <div className="flex min-h-screen items-center justify-center px-6">
                    <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/85 p-8 text-center shadow-xl shadow-slate-200/60 backdrop-blur">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-3xl">📄</div>
                        <h2 className="mt-4 text-xl font-semibold text-slate-900">报销记录不存在</h2>
                        <p className="mt-2 text-sm text-slate-500">请确认链接是否正确或记录是否已被移除。</p>
                        <button
                            onClick={() => router.push("/reimbursements/history")}
                            className="mt-6 inline-flex items-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-black"
                        >
                            返回列表
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen overflow-y-auto bg-gradient-to-br from-white via-slate-50 to-slate-100 text-slate-900">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_120%_at_50%_0%,rgba(59,130,246,0.14),rgba(14,165,233,0.08),transparent)]" />
            <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 pb-20 pt-24 sm:px-10">
                <section className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-lg shadow-slate-200/70 backdrop-blur lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-4">
                        <button
                            onClick={() => router.back()}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium uppercase tracking-[0.3em] text-slate-600 transition hover:border-slate-300"
                        >
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                            Reimbursement Detail
                        </button>
                        <div>
                            <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">{reimbursement.title}</h1>
                            <p className="mt-2 text-sm text-slate-500">报销 ID：{reimbursement.id}</p>
                        </div>
                        <div className="inline-flex items-center rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700">
                            {expenseTypeLabels[reimbursement.expenseType]}
                        </div>
                    </div>
                    <div className="flex items-center gap-3 self-start lg:self-center">
                        <span className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${getStatusColor(reimbursement.status)}`}>
                            {getStatusText(reimbursement.status)}
                        </span>
                    </div>
                </section>

                <section className="grid gap-8 lg:grid-cols-[2fr_1fr]">
                    <div className="space-y-6">
                        <div className="rounded-3xl border border-slate-200 bg-white/85 shadow-sm shadow-slate-200/50">
                            <div className="bg-gradient-to-r from-indigo-500 via-sky-500 to-cyan-400 px-6 py-5 text-white">
                                <h3 className="text-sm font-medium uppercase tracking-[0.3em] text-white/70">报销金额</h3>
                                <div className="mt-3 text-4xl font-semibold">
                                    {reimbursement.amountOriginal} {reimbursement.currency}
                                </div>
                                <div className="mt-2 text-sm text-white/80">
                                    ≈ ${reimbursement.amountUsdEquivalent.toFixed(2)} USD
                                </div>
                            </div>
                            <div className="grid gap-6 px-6 py-6 sm:grid-cols-2">
                                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">申请人</div>
                                    <div className="mt-2 text-sm font-medium text-slate-900">{reimbursement.applicant.username}</div>
                                    <div className="text-xs text-slate-500">{reimbursement.applicant.email}</div>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">提交时间</div>
                                    <div className="mt-2 text-sm font-medium text-slate-900">{formatDate(reimbursement.createdAt)}</div>
                                    <div className="text-xs text-slate-500">更新于 {formatDate(reimbursement.updatedAt)}</div>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">汇率</div>
                                    <div className="mt-2 text-sm font-medium text-slate-900">{reimbursement.exchangeRateToUsd}</div>
                                    <div className="text-xs text-slate-500">来源：{reimbursement.exchangeRateSource}</div>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">汇率锁定</div>
                                    <div className="mt-2 text-sm font-medium text-slate-900">{formatDate(reimbursement.exchangeRateTime)}</div>
                                    <div className="text-xs text-slate-500">
                                        {reimbursement.isManualRate ? "手动录入" : "系统汇率"}
                                        {reimbursement.convertedBy ? ` · ${reimbursement.convertedBy}` : ""}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {reimbursement.description && (
                            <div className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm shadow-slate-200/50">
                                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-500">费用说明</h3>
                                <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{reimbursement.description}</p>
                            </div>
                        )}

                        <div className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm shadow-slate-200/50">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-500">金额明细</h3>
                            <div className="mt-4 grid gap-4 text-sm text-slate-700 sm:grid-cols-2">
                                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                    <span>原始金额</span>
                                    <span className="font-medium">
                                        {reimbursement.amountOriginal} {reimbursement.currency}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                    <span>折合美元</span>
                                    <span className="font-medium">${reimbursement.amountUsdEquivalent.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                    <span>汇率值</span>
                                    <span className="font-medium">{reimbursement.exchangeRateToUsd}</span>
                                </div>
                                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                    <span>更新时间</span>
                                    <span className="font-medium">{formatDate(reimbursement.updatedAt)}</span>
                                </div>
                            </div>
                        </div>

                        {reimbursement.receiptUrl && (
                            <div className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm shadow-slate-200/50">
                                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-500">凭证链接</h3>
                                <p className="mt-2 text-xs text-slate-500">凭证会同步进入合规资料库，便于稽核与审计。</p>
                                <a
                                    href={reimbursement.receiptUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-indigo-600 transition hover:border-indigo-400 hover:text-indigo-800"
                                >
                                    查看发票
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm shadow-slate-200/50">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-500">审批链路</h3>
                            <div className="mt-4 space-y-4">
                                {reimbursement.reviewer && (
                                    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-slate-900">{reimbursement.reviewer.username}</div>
                                            <div className="text-xs text-slate-500">审核人</div>
                                            <div className="text-xs text-slate-500">{reimbursement.reviewer.email}</div>
                                        </div>
                                    </div>
                                )}
                                {reimbursement.approver && (
                                    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-slate-900">{reimbursement.approver.username}</div>
                                            <div className="text-xs text-slate-500">批准人</div>
                                            <div className="text-xs text-slate-500">{reimbursement.approver.email}</div>
                                        </div>
                                    </div>
                                )}
                                {!reimbursement.reviewer && !reimbursement.approver && (
                                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-400">
                                        暂无审核信息
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm shadow-slate-200/50">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-500">汇率信息</h3>
                            <div className="mt-4 space-y-3 text-sm text-slate-700">
                                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                    <span>汇率</span>
                                    <span className="font-medium">{reimbursement.exchangeRateToUsd}</span>
                                </div>
                                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                    <span>来源</span>
                                    <span className="font-medium">{reimbursement.exchangeRateSource}</span>
                                </div>
                                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                    <span>时间</span>
                                    <span className="font-medium">{formatDate(reimbursement.exchangeRateTime)}</span>
                                </div>
                                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                    <span>汇率类型</span>
                                    <span className="font-medium">{reimbursement.isManualRate ? "手动录入" : "系统汇率"}</span>
                                </div>
                                {reimbursement.convertedBy && (
                                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                        <span>转换人</span>
                                        <span className="font-medium">{reimbursement.convertedBy}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {reimbursement.txHash && (
                            <div className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm shadow-slate-200/50">
                                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-500">链上交易</h3>
                                <p className="mt-3 break-all rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-xs text-slate-700">
                                    {reimbursement.txHash}
                                </p>
                            </div>
                        )}

                        {reimbursement.reimbursementUrl && (
                            <div className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm shadow-slate-200/50">
                                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-500">支付证明</h3>
                                <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                    <a
                                        href={reimbursement.reimbursementUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="break-all text-sm font-medium text-indigo-600 hover:underline"
                                    >
                                        {reimbursement.reimbursementUrl}
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
