"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Stats {
    totalUsers: number;
    activeUsers: number;
    pendingUsers: number;
    totalReimbursements: number;
    pendingReimbursements: number;
    totalAmount: number;
}

export default function AdminDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

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
            fetchStats();
        }
    }, [status, session, router]);

    const fetchStats = async () => {
        try {
            const response = await fetch("/api/admin/stats");
            const data = await response.json() as { stats?: any; error?: string };

            if (response.ok) {
                setStats({
                    totalUsers: data.stats.users.total,
                    activeUsers: data.stats.users.active,
                    pendingUsers: data.stats.users.pending,
                    totalReimbursements: data.stats.reimbursements.total,
                    pendingReimbursements: data.stats.reimbursements.pending,
                    totalAmount: data.stats.reimbursements.totalAmount
                });
            } else {
                console.error("获取统计数据失败:", data.error);
                // 使用默认值
                setStats({
                    totalUsers: 0,
                    activeUsers: 0,
                    pendingUsers: 0,
                    totalReimbursements: 0,
                    pendingReimbursements: 0,
                    totalAmount: 0
                });
            }
        } catch (error) {
            console.error("获取统计数据失败:", error);
            // 使用默认值
            setStats({
                totalUsers: 0,
                activeUsers: 0,
                pendingUsers: 0,
                totalReimbursements: 0,
                pendingReimbursements: 0,
                totalAmount: 0
            });
        } finally {
            setLoading(false);
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

    if (!stats) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600">获取统计数据失败</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 页面头部 */}
                <div className="mb-8">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">管理概览</h1>
                                <p className="mt-2 text-lg text-gray-600">欢迎回来，{session?.user?.name}</p>
                                <p className="text-sm text-gray-500">这是您的管理仪表板，实时监控系统状态</p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-full">
                                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                                    <span className="text-sm font-medium text-green-700">系统运行正常</span>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-gray-500">最后更新</div>
                                    <div className="text-sm font-medium text-gray-900">{new Date().toLocaleTimeString()}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 关键指标卡片 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* 总用户数 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">总用户数</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                                    <p className="text-sm text-green-600 mt-1">
                                        +{stats.activeUsers} 活跃用户
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 待审核用户 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">待审核用户</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.pendingUsers}</p>
                                    <p className="text-sm text-yellow-600 mt-1">
                                        需要处理
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 总报销数 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">总报销数</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.totalReimbursements}</p>
                                    <p className="text-sm text-blue-600 mt-1">
                                        {stats.pendingReimbursements} 待审核
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 总金额 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">总金额</p>
                                    <p className="text-3xl font-bold text-gray-900">${stats.totalAmount.toFixed(2)}</p>
                                    <p className="text-sm text-green-600 mt-1">
                                        USD
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 快速操作区域 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    {/* 用户管理 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-4">
                            <h3 className="text-lg font-semibold text-white flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                </svg>
                                用户管理
                            </h3>
                        </div>
                        <div className="p-6 space-y-3">
                            <Link
                                href="/admin/users"
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <span className="text-sm font-medium text-gray-700">查看所有用户</span>
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                            <Link
                                href="/admin/users?status=pending"
                                className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
                            >
                                <span className="text-sm font-medium text-gray-700">待审核用户</span>
                                <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs font-medium rounded-full">
                                    {stats.pendingUsers}
                                </span>
                            </Link>
                            <Link
                                href="/admin/users?role=admin"
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <span className="text-sm font-medium text-gray-700">管理员列表</span>
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>
                    </div>

                    {/* 报销管理 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                            <h3 className="text-lg font-semibold text-white flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                报销管理
                            </h3>
                        </div>
                        <div className="p-6 space-y-3">
                            <Link
                                href="/admin/reimbursements"
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <span className="text-sm font-medium text-gray-700">查看所有报销</span>
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                            <Link
                                href="/admin/reimbursements?status=submitted"
                                className="flex items-center justify-between p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                            >
                                <span className="text-sm font-medium text-gray-700">待审核报销</span>
                                <span className="px-2 py-1 bg-orange-200 text-orange-800 text-xs font-medium rounded-full">
                                    {stats.pendingReimbursements}
                                </span>
                            </Link>
                            <Link
                                href="/admin/reimbursements?status=approved"
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <span className="text-sm font-medium text-gray-700">已批准报销</span>
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>
                    </div>

                    {/* 数据分析 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
                            <h3 className="text-lg font-semibold text-white flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                数据分析
                            </h3>
                        </div>
                        <div className="p-6 space-y-3">
                            <Link
                                href="/admin/analytics"
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <span className="text-sm font-medium text-gray-700">数据分析报告</span>
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                            <Link
                                href="/admin/analytics?export=csv"
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <span className="text-sm font-medium text-gray-700">导出数据 (CSV)</span>
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </Link>
                            <Link
                                href="/admin/settings"
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <span className="text-sm font-medium text-gray-700">系统设置</span>
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* 系统状态 */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">系统状态</h3>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex items-center space-x-3">
                                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                                <div>
                                    <div className="text-sm font-medium text-gray-900">系统版本</div>
                                    <div className="text-sm text-gray-500">v1.0.0</div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                                <div>
                                    <div className="text-sm font-medium text-gray-900">数据库</div>
                                    <div className="text-sm text-gray-500">PostgreSQL</div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                                <div>
                                    <div className="text-sm font-medium text-gray-900">部署环境</div>
                                    <div className="text-sm text-gray-500">Vercel</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
