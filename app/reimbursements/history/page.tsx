"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { expenseTypeLabels, type ExpenseType } from "@/lib/utils";

interface Reimbursement {
    id: string;
    title: string;
    description?: string;
    amountOriginal: number;
    currency: string;
    amountUsdEquivalent: number;
    status: string;
    receiptUrl?: string;
    expenseType: ExpenseType;
    createdAt: string;
    updatedAt: string;
}

export default function ReimbursementHistoryPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
            return;
        }

        if (status === "authenticated") {
            fetchReimbursements();
        }
    }, [status, router]);

    const fetchReimbursements = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/reimbursements");
            const data = await response.json() as { reimbursements?: Reimbursement[]; error?: string };

            if (response.ok) {
                setReimbursements(data.reimbursements || []);
            } else {
                setError("获取报销记录失败");
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
                return "bg-yellow-100 text-yellow-800";
            case "approved":
                return "bg-green-100 text-green-800";
            case "rejected":
                return "bg-red-100 text-red-800";
            case "paid":
                return "bg-blue-100 text-blue-800";
            default:
                return "bg-gray-100 text-gray-800";
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
            <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-slate-50 to-slate-100 text-slate-900">
                <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(115%_115%_at_50%_0%,rgba(59,130,246,0.14),rgba(14,165,233,0.08),transparent)]" />
                <div className="flex min-h-screen items-center justify-center">
                    <div className="flex flex-col items-center gap-4 rounded-3xl border border-slate-200 bg-white/80 px-12 py-10 shadow-lg shadow-slate-200/60 backdrop-blur">
                        <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-500" />
                        <p className="text-sm font-medium text-slate-600">正在加载报销记录...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (status === "unauthenticated") {
        return null;
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-slate-50 to-slate-100 text-slate-900">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(115%_115%_at_50%_0%,rgba(79,70,229,0.14),rgba(14,165,233,0.08),transparent)]" />
            <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-12 px-6 pb-20 pt-24 sm:px-10">
                <section className="space-y-6 text-center">
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-5 py-2 text-xs font-medium uppercase tracking-[0.3em] text-slate-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                        Reimbursement History
                    </span>
                    <div className="space-y-4">
                        <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">我的报销记录</h1>
                        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                            对齐所有已提交的报销申请，了解当前状态、费用类型与审批进度。如需新增申请，可随时返回提交入口。
                        </p>
                    </div>
                    <button
                        onClick={() => router.push("/reimbursements")}
                        className="inline-flex items-center rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-black"
                    >
                        提交新的报销
                    </button>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-lg shadow-slate-200/60 backdrop-blur">
                    {error && (
                        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                            {error}
                        </div>
                    )}

                    {reimbursements.length === 0 ? (
                        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-white/70 px-10 py-16 text-center shadow-sm">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">📄</div>
                            <h3 className="text-lg font-semibold text-slate-900">暂无报销记录</h3>
                            <p className="text-sm text-slate-500">提交第一笔报销申请，让财务流程在 ReimX 中留痕。</p>
                            <button
                                onClick={() => router.push("/reimbursements")}
                                className="inline-flex items-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-black"
                            >
                                创建申请
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {reimbursements.slice(0, 3).map((reimbursement) => (
                                    <div key={reimbursement.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
                                        <div className="flex items-start justify-between">
                                            <div className="text-sm font-medium text-slate-900">{reimbursement.title}</div>
                                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(reimbursement.status)}`}>
                                                {getStatusText(reimbursement.status)}
                                            </span>
                                        </div>
                                        <div className="mt-3 text-2xl font-semibold text-slate-900">
                                            {reimbursement.amountOriginal} {reimbursement.currency}
                                        </div>
                                        <div className="mt-1 text-xs text-slate-500">
                                            ≈ ${reimbursement.amountUsdEquivalent.toFixed(2)} USD
                                        </div>
                                        <div className="mt-3 inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">
                                            {expenseTypeLabels[reimbursement.expenseType]}
                                        </div>
                                        <div className="mt-4 text-xs text-slate-500">
                                            提交于 {formatDate(reimbursement.createdAt)}
                                        </div>
                                        <button
                                            onClick={() => router.push(`/reimbursements/${reimbursement.id}`)}
                                            className="mt-4 inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
                                        >
                                            查看详情 →
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50/80">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                标题 & 描述
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                金额
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                费用类型
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                状态
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                提交时间
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                操作
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 bg-white">
                                        {reimbursements.map((reimbursement) => (
                                            <tr key={reimbursement.id} className="transition hover:bg-slate-50/60">
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-slate-900">{reimbursement.title}</div>
                                                    {reimbursement.description && (
                                                        <div className="mt-1 line-clamp-2 text-xs text-slate-500">
                                                            {reimbursement.description}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-900">
                                                    <div>
                                                        {reimbursement.amountOriginal} {reimbursement.currency}
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        ≈ ${reimbursement.amountUsdEquivalent.toFixed(2)} USD
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                                                        {expenseTypeLabels[reimbursement.expenseType]}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusColor(reimbursement.status)}`}>
                                                        {getStatusText(reimbursement.status)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500">
                                                    {formatDate(reimbursement.createdAt)}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium">
                                                    <button
                                                        onClick={() => {
                                                            router.push(`/reimbursements/${reimbursement.id}`);
                                                        }}
                                                        className="text-indigo-600 hover:text-indigo-800"
                                                    >
                                                        查看详情
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
