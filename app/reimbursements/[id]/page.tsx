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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 页面头部 */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => router.back()}
                                className="p-2 rounded-lg bg-white shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
                            >
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">{reimbursement.title}</h1>
                                <p className="text-sm text-gray-500 mt-1">报销ID: {reimbursement.id}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <span className={`inline-flex px-4 py-2 text-sm font-semibold rounded-full ${getStatusColor(reimbursement.status)}`}>
                                {getStatusText(reimbursement.status)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* 左侧主要内容 */}
                    <div className="xl:col-span-2 space-y-6">
                        {/* 金额卡片 - 重点突出 */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                                <h3 className="text-lg font-semibold text-white">报销金额</h3>
                            </div>
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-3xl font-bold text-gray-900">
                                            {reimbursement.amountOriginal} {reimbursement.currency}
                                        </div>
                                        <div className="text-lg text-gray-600 mt-1">
                                            ≈ ${reimbursement.amountUsdEquivalent.toFixed(2)} USD
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-gray-500">链别</div>
                                        <div className="text-lg font-semibold text-gray-900 capitalize">{reimbursement.chain}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 基本信息卡片 */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">基本信息</h3>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <div className="text-sm font-medium text-gray-500 mb-1">申请人</div>
                                            <div className="text-base text-gray-900 font-medium">{reimbursement.applicant.username}</div>
                                            <div className="text-sm text-gray-600">{reimbursement.applicant.email}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-500 mb-1">提交时间</div>
                                            <div className="text-base text-gray-900">{formatDate(reimbursement.createdAt)}</div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="text-sm font-medium text-gray-500 mb-1">更新时间</div>
                                            <div className="text-base text-gray-900">{formatDate(reimbursement.updatedAt)}</div>
                                        </div>
                                        {reimbursement.txHash && (
                                            <div>
                                                <div className="text-sm font-medium text-gray-500 mb-1">交易哈希</div>
                                                <div className="text-sm text-gray-900 font-mono break-all bg-gray-50 px-3 py-2 rounded-lg">
                                                    {reimbursement.txHash}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 描述信息 */}
                        {reimbursement.description && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900">详细描述</h3>
                                </div>
                                <div className="p-6">
                                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{reimbursement.description}</p>
                                </div>
                            </div>
                        )}

                        {/* 发票链接 */}
                        {reimbursement.receiptUrl && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900">发票/收据</h3>
                                </div>
                                <div className="p-6">
                                    <a
                                        href={reimbursement.receiptUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                        查看发票
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 右侧信息栏 */}
                    <div className="space-y-6">
                        {/* 审核信息 */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">审核信息</h3>
                            </div>
                            <div className="p-6 space-y-4">
                                {reimbursement.reviewer && (
                                    <div className="flex items-start space-x-3">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-gray-900">{reimbursement.reviewer.username}</div>
                                            <div className="text-xs text-gray-500">审核人</div>
                                            <div className="text-xs text-gray-600">{reimbursement.reviewer.email}</div>
                                        </div>
                                    </div>
                                )}
                                {reimbursement.approver && (
                                    <div className="flex items-start space-x-3">
                                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-gray-900">{reimbursement.approver.username}</div>
                                            <div className="text-xs text-gray-500">批准人</div>
                                            <div className="text-xs text-gray-600">{reimbursement.approver.email}</div>
                                        </div>
                                    </div>
                                )}
                                {!reimbursement.reviewer && !reimbursement.approver && (
                                    <div className="text-center py-4">
                                        <div className="text-gray-400 text-sm">暂无审核信息</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 汇率信息 */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">汇率信息</h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">汇率</span>
                                    <span className="text-sm font-medium text-gray-900">{reimbursement.exchangeRateToUsd}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">来源</span>
                                    <span className="text-sm font-medium text-gray-900">{reimbursement.exchangeRateSource}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">时间</span>
                                    <span className="text-sm font-medium text-gray-900">{formatDate(reimbursement.exchangeRateTime)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">手动汇率</span>
                                    <span className={`text-sm font-medium ${reimbursement.isManualRate ? 'text-orange-600' : 'text-gray-900'}`}>
                                        {reimbursement.isManualRate ? "是" : "否"}
                                    </span>
                                </div>
                                {reimbursement.convertedBy && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">转换人</span>
                                        <span className="text-sm font-medium text-gray-900">{reimbursement.convertedBy}</span>
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
