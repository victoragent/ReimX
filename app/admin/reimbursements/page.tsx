"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { cn, expenseTypeLabels, type ExpenseType } from "@/lib/utils";

interface Reimbursement {
    id: string;
    amount: number;
    amountOriginal?: number;
    currency: string;
    receiptUrl?: string;
    expenseType?: ExpenseType;
    amountUsdEquivalent?: number;
    description: string;
    status: string;
    submittedAt: string;
    reviewedAt?: string;
    reviewer?: {
        username: string;
    };
    applicant: {
        id: string;
        username: string;
        email: string;
    };
    attachments?: {
        id: string;
        filename: string;
        url: string;
    }[];
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

export default function AdminReimbursementsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [currencyFilter, setCurrencyFilter] = useState("");
    const [expenseTypeFilter, setExpenseTypeFilter] = useState("");
    const [minUsdFilter, setMinUsdFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedReimbursement, setSelectedReimbursement] = useState<Reimbursement | null>(null);
    const [reviewComment, setReviewComment] = useState("");
    const [reviewing, setReviewing] = useState(false);
    const submittedCount = Array.isArray(reimbursements)
        ? reimbursements.filter(r => r.status === "submitted").length
        : 0;

    const subNavigation = [
        { name: "报销列表", href: "/admin/reimbursements" },
        { name: "Safe Wallet 批付", href: "/admin/reimbursements/safewallet" }
    ];

    const isSubnavActive = (href: string) => {
        if (!pathname) return false;
        return pathname === href;
    };

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
            return;
        }

        if (status === "authenticated" && session?.user?.role !== "admin") {
            router.push("/dashboard");
            return;
        }

        if (status === "authenticated" && session?.user?.role === "admin") {
            fetchReimbursements();
        }
    }, [status, session, router, currentPage, searchTerm, statusFilter, currencyFilter, expenseTypeFilter, minUsdFilter]);

    const fetchReimbursements = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: "10",
                ...(searchTerm && { search: searchTerm }),
                ...(statusFilter && { status: statusFilter }),
                ...(currencyFilter && { currency: currencyFilter }),
                ...(expenseTypeFilter && { expenseType: expenseTypeFilter }),
                ...(minUsdFilter && { minUsd: minUsdFilter })
            });

            const response = await fetch(`/api/admin/reimbursements?${params}`);
            const data = await response.json() as { reimbursements?: Reimbursement[]; pagination?: Pagination; error?: string };

            if (response.ok) {
                setReimbursements(data.reimbursements!);
                setPagination(data.pagination!);
            } else {
                setError(data.error || "获取报销列表失败");
            }
        } catch (error) {
            setError("网络错误，请重试");
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (reimbursementId: string, action: "approve" | "reject") => {
        try {
            setReviewing(true);
            const response = await fetch(`/api/admin/reimbursements/${reimbursementId}/review`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    action,
                    comment: reviewComment
                }),
            });

            const data = await response.json() as { error?: string };

            if (response.ok) {
                setSelectedReimbursement(null);
                setReviewComment("");
                fetchReimbursements();
            } else {
                setError(data.error || "审核失败");
            }
        } catch (error) {
            setError("网络错误，请重试");
        } finally {
            setReviewing(false);
        }
    };

    const handleDelete = async (reimbursementId: string) => {
        if (!confirm("确定要删除这条报销记录吗？此操作无法撤销。")) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/reimbursements/${reimbursementId}`, {
                method: "DELETE",
            });

            const data = await response.json() as { error?: string };

            if (response.ok) {
                setSelectedReimbursement(null);
                fetchReimbursements();
            } else {
                setError(data.error || "删除失败");
            }
        } catch (error) {
            setError("网络错误，请重试");
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
                return "bg-slate-100 text-slate-800";
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

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-500" />
                    <p className="mt-4 text-sm font-medium text-slate-600">加载中...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* 页面标题和统计 */}
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm shadow-slate-200/50 backdrop-blur">
                <div className="flex flex-wrap items-center justify-between gap-6">
                    <div className="space-y-3">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">报销管理</h1>
                            <p className="mt-1 text-slate-600">审核企业报销、生成 Safe Wallet 批次并跟踪执行状态</p>
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
                    <div className="flex items-center space-x-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-indigo-600">{pagination?.total || 0}</div>
                            <div className="text-sm text-slate-500">总申请</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">
                                {submittedCount}
                            </div>
                            <div className="text-sm text-slate-500">待审核</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 搜索和筛选 */}
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm shadow-slate-200/50 backdrop-blur">

                {/* 搜索和筛选 */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-6 gap-4">
                    <input
                        type="text"
                        placeholder="搜索用户或描述"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border-slate-200 rounded-md shadow-sm focus:ring-indigo-200 focus:border-indigo-400"
                    />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border-slate-200 rounded-md shadow-sm focus:ring-indigo-200 focus:border-indigo-400"
                    >
                        <option value="">所有状态</option>
                        <option value="submitted">待审核</option>
                        <option value="approved">已批准</option>
                        <option value="rejected">已拒绝</option>
                        <option value="paid">已支付</option>
                    </select>
                    <select
                        value={currencyFilter}
                        onChange={(e) => setCurrencyFilter(e.target.value)}
                        className="border-slate-200 rounded-md shadow-sm focus:ring-indigo-200 focus:border-indigo-400"
                    >
                        <option value="">所有币种</option>
                        <option value="USD">美元</option>
                        <option value="CNY">人民币</option>
                        <option value="HKD">港币</option>
                    </select>
                    <select
                        value={expenseTypeFilter}
                        onChange={(e) => setExpenseTypeFilter(e.target.value)}
                        className="border-slate-200 rounded-md shadow-sm focus:ring-indigo-200 focus:border-indigo-400"
                    >
                        <option value="">所有费用类型</option>
                        {Object.entries(expenseTypeLabels).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>

                    <button
                        onClick={fetchReimbursements}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                        搜索
                    </button>
                </div>

                {error && (
                    <div className="mb-4 text-red-600 text-sm">{error}</div>
                )}

                {/* 报销列表 */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    申请人
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">费用类型</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">金额</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">金额（美元）</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    描述
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    状态
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    提交时间
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    操作
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white/80 divide-y divide-gray-200">
                            {reimbursements?.map((reimbursement) => (
                                <tr key={reimbursement.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-slate-900">
                                                {reimbursement.applicant?.username || 'N/A'}
                                            </div>
                                            <div className="text-sm text-slate-500">
                                                {reimbursement.applicant?.email || 'N/A'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                        {expenseTypeLabels[reimbursement.expenseType ?? "other"]}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                        {reimbursement.amount || reimbursement.amountOriginal || 'N/A'} {reimbursement.currency}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                        {typeof reimbursement.amountUsdEquivalent === 'number' ? `${reimbursement.amountUsdEquivalent.toFixed(2)} USD` : '—'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
                                        {reimbursement.description}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(reimbursement.status)}`}>
                                            {getStatusText(reimbursement.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {reimbursement.submittedAt ? new Date(reimbursement.submittedAt).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => setSelectedReimbursement(reimbursement)}
                                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                                        >
                                            查看详情
                                        </button>
                                        {reimbursement.status === "submitted" && (
                                            <>
                                                <button
                                                    onClick={() => handleReview(reimbursement.id, "approve")}
                                                    className="text-green-600 hover:text-green-900 mr-3"
                                                >
                                                    批准
                                                </button>
                                                <button
                                                    onClick={() => handleReview(reimbursement.id, "reject")}
                                                    className="text-red-600 hover:text-red-900 mr-3"
                                                >
                                                    拒绝
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => handleDelete(reimbursement.id)}
                                            className="text-slate-400 hover:text-red-600"
                                            title="删除"
                                        >
                                            删除
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* 分页 */}
                {pagination && pagination.pages > 1 && (
                    <div className="mt-6 flex justify-center">
                        <nav className="flex space-x-2">
                            <button
                                onClick={() => setCurrentPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:border-slate-300 disabled:opacity-50 disabled:hover:border-slate-200"
                            >
                                上一页
                            </button>
                            <span className="px-3 py-2 text-sm text-slate-700">
                                第 {currentPage} 页，共 {pagination.pages} 页
                            </span>
                            <button
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={currentPage === pagination.pages}
                                className="rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:border-slate-300 disabled:opacity-50 disabled:hover:border-slate-200"
                            >
                                下一页
                            </button>
                        </nav>
                    </div>
                )}
            </div>

            {/* 报销详情模态框 */}
            {selectedReimbursement && (
                <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 backdrop-blur-sm px-4 py-10">
                    <div className="relative flex w-full max-w-4xl max-h-[90vh] flex-col rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-2xl shadow-slate-300/70">
                        <button
                            onClick={() => setSelectedReimbursement(null)}
                            className="absolute right-6 top-6 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:text-slate-900"
                            aria-label="关闭"
                        >
                            ✕
                        </button>
                        {/* 内容区域可滚动，底部操作区固定 */}
                        <div className="mt-4 flex-1 space-y-6 overflow-y-auto pr-1 md:pr-2">
                            <div className="space-y-2">
                                <p className="text-xs font-medium uppercase tracking-[0.3em] text-indigo-500">Reimbursement</p>
                                <h3 className="text-2xl font-semibold text-slate-900">
                                    {selectedReimbursement.description || selectedReimbursement.applicant?.username || "报销详情"}
                                </h3>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                    <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                                        {expenseTypeLabels[selectedReimbursement.expenseType ?? "other"]}
                                    </span>
                                    <span>提交时间：{selectedReimbursement.submittedAt ? new Date(selectedReimbursement.submittedAt).toLocaleString() : "N/A"}</span>
                                </div>
                            </div>

                            {/* 金额卡片：突出显示本币金额与折合美元 */}
                            <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm shadow-slate-200/50">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-[0.3em] text-slate-500">金额</p>
                                        <div className="mt-1 text-3xl font-semibold text-slate-900">
                                            {selectedReimbursement.amount || selectedReimbursement.amountOriginal || "N/A"}
                                            <span className="ml-2 text-lg text-slate-500">{selectedReimbursement.currency}</span>
                                        </div>
                                    </div>
                                    <div className="text-sm text-slate-600">
                                        <span className="mr-2 text-slate-500">金额（美元）</span>
                                        <span className="font-semibold text-indigo-600">
                                            {typeof selectedReimbursement.amountUsdEquivalent === "number"
                                                ? `${selectedReimbursement.amountUsdEquivalent.toFixed(2)} USD`
                                                : "—"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm shadow-slate-200/50">
                                    <h4 className="text-sm font-semibold text-slate-900">申请人信息</h4>
                                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                                        <div>
                                            <span className="font-medium text-slate-700">姓名：</span>{selectedReimbursement.applicant?.username || "N/A"}
                                        </div>
                                        <div>
                                            <span className="font-medium text-slate-700">邮箱：</span>{selectedReimbursement.applicant?.email || "N/A"}
                                        </div>
                                        <div>
                                            <span className="font-medium text-slate-700">状态：</span>
                                            <span className={cn("ml-2 rounded-full px-2 py-1 text-xs", getStatusColor(selectedReimbursement.status))}>{getStatusText(selectedReimbursement.status)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm shadow-slate-200/50">
                                    <h4 className="text-sm font-semibold text-slate-900">费用说明</h4>
                                    <p className="mt-3 text-sm leading-relaxed text-slate-600">{selectedReimbursement.description || "暂无描述"}</p>
                                </div>
                            </div>

                            {/* 原始凭证链接（如果有） */}
                            {selectedReimbursement.receiptUrl && (
                                <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm shadow-slate-200/50">
                                    <h4 className="text-sm font-semibold text-slate-900">报销凭证链接</h4>
                                    <p className="mt-2 text-sm text-slate-600">
                                        用户在提交报销时上传了原始凭证链接：
                                    </p>
                                    <a
                                        href={selectedReimbursement.receiptUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-3 inline-flex items-center break-all text-sm font-medium text-indigo-600 hover:text-indigo-800"
                                    >
                                        查看凭证链接
                                        <span className="ml-1 text-xs">↗</span>
                                    </a>
                                </div>
                            )}

                            {selectedReimbursement.attachments && selectedReimbursement.attachments.length > 0 && (
                                <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm shadow-slate-200/50">
                                    <h4 className="text-sm font-semibold text-slate-900">附件</h4>
                                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                                        {selectedReimbursement.attachments.map((attachment) => (
                                            <div key={attachment.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm shadow-slate-200/40">
                                                <div className="truncate text-sm font-medium text-slate-800">{attachment.filename}</div>
                                                <a
                                                    href={attachment.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="mt-1 inline-flex items-center text-xs font-medium text-indigo-600 hover:text-indigo-800"
                                                >
                                                    查看文件 →
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedReimbursement.status === "submitted" && (
                                <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm shadow-slate-200/50">
                                    <h4 className="text-sm font-semibold text-slate-900">审核操作</h4>
                                    <div className="mt-3 space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">审核意见</label>
                                            <textarea
                                                value={reviewComment}
                                                onChange={(e) => setReviewComment(e.target.value)}
                                                rows={3}
                                                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                                placeholder="请输入审核意见..."
                                            />
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => handleReview(selectedReimbursement.id, "approve")}
                                                disabled={reviewing}
                                                className="inline-flex flex-1 items-center justify-center rounded-full bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:opacity-60"
                                            >
                                                {reviewing ? "处理中..." : "批准"}
                                            </button>
                                            <button
                                                onClick={() => handleReview(selectedReimbursement.id, "reject")}
                                                disabled={reviewing}
                                                className="inline-flex flex-1 items-center justify-center rounded-full bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-600 disabled:opacity-60"
                                            >
                                                {reviewing ? "处理中..." : "拒绝"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* 底部操作栏（固定在模态框底部） */}
                        <div className="mt-4 flex justify-end border-t border-slate-200 pt-4">
                            <button
                                onClick={() => handleDelete(selectedReimbursement.id)}
                                className="text-sm font-medium text-slate-400 transition hover:text-red-600"
                            >
                                删除此报销单
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
