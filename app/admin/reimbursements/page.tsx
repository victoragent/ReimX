"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Reimbursement {
    id: string;
    amount: number;
    amountOriginal?: number;
    currency: string;
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
    const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [currencyFilter, setCurrencyFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedReimbursement, setSelectedReimbursement] = useState<Reimbursement | null>(null);
    const [reviewComment, setReviewComment] = useState("");
    const [reviewing, setReviewing] = useState(false);

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
    }, [status, session, router, currentPage, searchTerm, statusFilter, currencyFilter]);

    const fetchReimbursements = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: "10",
                ...(searchTerm && { search: searchTerm }),
                ...(statusFilter && { status: statusFilter }),
                ...(currencyFilter && { currency: currencyFilter })
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

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
                    <p className="mt-4 text-gray-600">加载中...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 页面标题和统计 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">报销管理</h1>
                        <p className="mt-1 text-gray-600">审核和管理所有报销申请</p>
                    </div>
                    <div className="flex items-center space-x-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-indigo-600">{pagination?.total || 0}</div>
                            <div className="text-sm text-gray-500">总申请</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">
                                {reimbursements.filter(r => r.status === 'submitted').length}
                            </div>
                            <div className="text-sm text-gray-500">待审核</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 搜索和筛选 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">

                {/* 搜索和筛选 */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input
                        type="text"
                        placeholder="搜索用户或描述"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
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
                        className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">所有币种</option>
                        <option value="USD">美元</option>
                        <option value="CNY">人民币</option>
                        <option value="HKD">港币</option>
                        <option value="ETH">以太坊</option>
                        <option value="SOL">Solana</option>
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
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    申请人
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    金额
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    描述
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    状态
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    提交时间
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    操作
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {reimbursements?.map((reimbursement) => (
                                <tr key={reimbursement.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {reimbursement.applicant?.username || 'N/A'}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {reimbursement.applicant?.email || 'N/A'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {reimbursement.amount || reimbursement.amountOriginal || 'N/A'} {reimbursement.currency}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                        {reimbursement.description}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(reimbursement.status)}`}>
                                            {getStatusText(reimbursement.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    拒绝
                                                </button>
                                            </>
                                        )}
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
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                            >
                                上一页
                            </button>
                            <span className="px-3 py-2 text-sm text-gray-700">
                                第 {currentPage} 页，共 {pagination.pages} 页
                            </span>
                            <button
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={currentPage === pagination.pages}
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                            >
                                下一页
                            </button>
                        </nav>
                    </div>
                )}
            </div>

            {/* 报销详情模态框 */}
            {selectedReimbursement && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900">报销详情</h3>
                                <button
                                    onClick={() => setSelectedReimbursement(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">基本信息</h4>
                                    <div className="space-y-2 text-sm">
                                        <div><span className="font-medium">申请人：</span>{selectedReimbursement.applicant?.username || 'N/A'}</div>
                                        <div><span className="font-medium">邮箱：</span>{selectedReimbursement.applicant?.email || 'N/A'}</div>
                                        <div><span className="font-medium">金额：</span>{selectedReimbursement.amount || selectedReimbursement.amountOriginal || 'N/A'} {selectedReimbursement.currency}</div>
                                        <div><span className="font-medium">状态：</span>
                                            <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(selectedReimbursement.status)}`}>
                                                {getStatusText(selectedReimbursement.status)}
                                            </span>
                                        </div>
                                        <div><span className="font-medium">提交时间：</span>{selectedReimbursement.submittedAt ? new Date(selectedReimbursement.submittedAt).toLocaleString() : 'N/A'}</div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">描述</h4>
                                    <p className="text-sm text-gray-600">{selectedReimbursement.description}</p>
                                </div>
                            </div>

                            {selectedReimbursement.attachments && selectedReimbursement.attachments.length > 0 && (
                                <div className="mt-6">
                                    <h4 className="font-medium text-gray-900 mb-2">附件</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {selectedReimbursement.attachments.map((attachment) => (
                                            <div key={attachment.id} className="border rounded-lg p-3">
                                                <div className="text-sm font-medium truncate">{attachment.filename}</div>
                                                <a
                                                    href={attachment.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-indigo-600 hover:text-indigo-900 text-xs"
                                                >
                                                    查看文件
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedReimbursement.status === "submitted" && (
                                <div className="mt-6">
                                    <h4 className="font-medium text-gray-900 mb-2">审核操作</h4>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">审核意见</label>
                                            <textarea
                                                value={reviewComment}
                                                onChange={(e) => setReviewComment(e.target.value)}
                                                rows={3}
                                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="请输入审核意见..."
                                            />
                                        </div>
                                        <div className="flex space-x-3">
                                            <button
                                                onClick={() => handleReview(selectedReimbursement.id, "approve")}
                                                disabled={reviewing}
                                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                                            >
                                                {reviewing ? "处理中..." : "批准"}
                                            </button>
                                            <button
                                                onClick={() => handleReview(selectedReimbursement.id, "reject")}
                                                disabled={reviewing}
                                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                                            >
                                                {reviewing ? "处理中..." : "拒绝"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
}
