"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";

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
    chain: string;
    receiptUrl?: string;
    status: string;
    reviewerId?: string;
    approverId?: string;
    txHash?: string;
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

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 py-6">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white shadow rounded-lg p-6">
                        <div className="text-center">
                            <div className="text-red-500 text-6xl mb-4">⚠️</div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">加载失败</h2>
                            <p className="text-gray-600 mb-4">{error}</p>
                            <button
                                onClick={() => router.back()}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                返回
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!reimbursement) {
        return (
            <div className="min-h-screen bg-gray-50 py-6">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white shadow rounded-lg p-6">
                        <div className="text-center">
                            <div className="text-gray-400 text-6xl mb-4">📄</div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">报销记录不存在</h2>
                            <p className="text-gray-600 mb-4">请检查链接是否正确</p>
                            <button
                                onClick={() => router.push("/reimbursements/history")}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                返回列表
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-6">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{reimbursement.title}</h1>
                                <p className="text-sm text-gray-500 mt-1">报销ID: {reimbursement.id}</p>
                            </div>
                            <div className="flex items-center space-x-3">
                                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(reimbursement.status)}`}>
                                    {getStatusText(reimbursement.status)}
                                </span>
                                <button
                                    onClick={() => router.back()}
                                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    返回
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* 基本信息 */}
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">基本信息</h3>
                                    <dl className="space-y-3">
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">申请人</dt>
                                            <dd className="text-sm text-gray-900">{reimbursement.applicant.username}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">邮箱</dt>
                                            <dd className="text-sm text-gray-900">{reimbursement.applicant.email}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">金额</dt>
                                            <dd className="text-sm text-gray-900">
                                                {reimbursement.amountOriginal} {reimbursement.currency}
                                                <span className="text-gray-500 ml-2">
                                                    (≈ ${reimbursement.amountUsdEquivalent.toFixed(2)} USD)
                                                </span>
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">链别</dt>
                                            <dd className="text-sm text-gray-900 capitalize">{reimbursement.chain}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">提交时间</dt>
                                            <dd className="text-sm text-gray-900">{formatDate(reimbursement.createdAt)}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">更新时间</dt>
                                            <dd className="text-sm text-gray-900">{formatDate(reimbursement.updatedAt)}</dd>
                                        </div>
                                    </dl>
                                </div>

                                {/* 汇率信息 */}
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">汇率信息</h3>
                                    <dl className="space-y-3">
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">汇率</dt>
                                            <dd className="text-sm text-gray-900">{reimbursement.exchangeRateToUsd}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">汇率来源</dt>
                                            <dd className="text-sm text-gray-900">{reimbursement.exchangeRateSource}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">汇率时间</dt>
                                            <dd className="text-sm text-gray-900">{formatDate(reimbursement.exchangeRateTime)}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">手动汇率</dt>
                                            <dd className="text-sm text-gray-900">{reimbursement.isManualRate ? "是" : "否"}</dd>
                                        </div>
                                        {reimbursement.convertedBy && (
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">转换人</dt>
                                                <dd className="text-sm text-gray-900">{reimbursement.convertedBy}</dd>
                                            </div>
                                        )}
                                    </dl>
                                </div>
                            </div>

                            {/* 审核信息 */}
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">审核信息</h3>
                                    <dl className="space-y-3">
                                        {reimbursement.reviewer && (
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">审核人</dt>
                                                <dd className="text-sm text-gray-900">
                                                    {reimbursement.reviewer.username} ({reimbursement.reviewer.email})
                                                </dd>
                                            </div>
                                        )}
                                        {reimbursement.approver && (
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">批准人</dt>
                                                <dd className="text-sm text-gray-900">
                                                    {reimbursement.approver.username} ({reimbursement.approver.email})
                                                </dd>
                                            </div>
                                        )}
                                        {reimbursement.txHash && (
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">交易哈希</dt>
                                                <dd className="text-sm text-gray-900 font-mono break-all">{reimbursement.txHash}</dd>
                                            </div>
                                        )}
                                    </dl>
                                </div>

                                {/* 描述信息 */}
                                {reimbursement.description && (
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">详细描述</h3>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{reimbursement.description}</p>
                                    </div>
                                )}

                                {/* 发票链接 */}
                                {reimbursement.receiptUrl && (
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">发票/收据</h3>
                                        <a
                                            href={reimbursement.receiptUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-indigo-600 hover:text-indigo-500 text-sm break-all"
                                        >
                                            {reimbursement.receiptUrl}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
