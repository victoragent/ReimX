"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface AnalyticsData {
    users: {
        total: number;
        active: number;
        pending: number;
        suspended: number;
        growth: number;
    };
    reimbursements: {
        total: number;
        pending: number;
        approved: number;
        rejected: number;
        totalAmount: number;
    };
    efficiency: {
        approvalRate: string;
        avgReviewTime: number;
    };
    trends: {
        monthly: any[];
        userGrowth: any[];
        reimbursementTrends: any[];
    };
    recent: {
        users: any[];
        reimbursements: any[];
    };
}

export default function AdminAnalyticsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [timeRange, setTimeRange] = useState("6months");

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
            fetchAnalytics();
        }
    }, [status, session, router, timeRange]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/admin/stats?timeRange=${timeRange}`);
            const data = await response.json() as { stats?: AnalyticsData; error?: string };

            if (response.ok) {
                setAnalytics(data.stats!);
            } else {
                setError(data.error || "获取统计数据失败");
            }
        } catch (error) {
            setError("网络错误，请重试");
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number, currency: string = "USD") => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currency
        }).format(amount);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("zh-CN");
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

    if (!analytics) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600">获取统计数据失败</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8 px-4 py-5 sm:p-6">
                <h1 className="text-3xl font-bold text-gray-900">数据分析</h1>
                <p className="mt-2 text-gray-600">系统运营数据统计与分析</p>
            </div>

            {/* 时间范围选择 */}
            <div className="mb-6">
                <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                    <option value="1month">最近1个月</option>
                    <option value="3months">最近3个月</option>
                    <option value="6months">最近6个月</option>
                    <option value="1year">最近1年</option>
                </select>
            </div>

            {error && (
                <div className="mb-4 text-red-600 text-sm">{error}</div>
            )}

            {/* 关键指标卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">总用户数</dt>
                                    <dd className="text-lg font-medium text-gray-900">{analytics.users.total}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">活跃用户</dt>
                                    <dd className="text-lg font-medium text-gray-900">{analytics.users.active}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">总报销数</dt>
                                    <dd className="text-lg font-medium text-gray-900">{analytics.reimbursements.total}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">总金额</dt>
                                    <dd className="text-lg font-medium text-gray-900">
                                        {formatCurrency(analytics.reimbursements.totalAmount)}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 详细统计 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* 用户统计 */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">用户统计</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500">总用户数</span>
                                <span className="text-sm font-medium">{analytics.users.total}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500">活跃用户</span>
                                <span className="text-sm font-medium text-green-600">{analytics.users.active}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500">待审核用户</span>
                                <span className="text-sm font-medium text-yellow-600">{analytics.users.pending}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500">已禁用用户</span>
                                <span className="text-sm font-medium text-red-600">{analytics.users.suspended}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 报销统计 */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">报销统计</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500">总报销数</span>
                                <span className="text-sm font-medium">{analytics.reimbursements.total}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500">待审核</span>
                                <span className="text-sm font-medium text-yellow-600">{analytics.reimbursements.pending}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500">已批准</span>
                                <span className="text-sm font-medium text-green-600">{analytics.reimbursements.approved}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500">已拒绝</span>
                                <span className="text-sm font-medium text-red-600">{analytics.reimbursements.rejected}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 效率指标 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">审核效率</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500">批准率</span>
                                <span className="text-sm font-medium">{analytics.efficiency.approvalRate}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500">平均审核时间</span>
                                <span className="text-sm font-medium">{analytics.efficiency.avgReviewTime} 天</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">财务概览</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500">总报销金额</span>
                                <span className="text-sm font-medium">{formatCurrency(analytics.reimbursements.totalAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500">平均报销金额</span>
                                <span className="text-sm font-medium">
                                    {analytics.reimbursements.total > 0
                                        ? formatCurrency(analytics.reimbursements.totalAmount / analytics.reimbursements.total)
                                        : formatCurrency(0)
                                    }
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 最近活动 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">最近注册用户</h3>
                        <div className="space-y-3">
                            {analytics.recent.users.map((user: any) => (
                                <div key={user.id} className="flex justify-between items-center">
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">{user.username}</div>
                                        <div className="text-sm text-gray-500">{user.email}</div>
                                    </div>
                                    <div className="text-sm text-gray-500">{formatDate(user.createdAt)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">最近报销申请</h3>
                        <div className="space-y-3">
                            {analytics.recent.reimbursements.map((reimbursement: any) => (
                                <div key={reimbursement.id} className="flex justify-between items-center">
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {reimbursement.amount} {reimbursement.currency}
                                        </div>
                                        <div className="text-sm text-gray-500">{reimbursement.applicant?.username || 'N/A'}</div>
                                    </div>
                                    <div className="text-sm text-gray-500">{formatDate(reimbursement.createdAt)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
