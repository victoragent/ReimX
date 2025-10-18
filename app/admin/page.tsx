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
        <div className="space-y-6">
            {/* 页面标题 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">管理概览</h1>
                        <p className="mt-1 text-gray-600">欢迎回来，{session?.user?.name}，这是您的管理仪表板</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        <span className="text-sm text-gray-500">系统运行正常</span>
                    </div>
                </div>
            </div>

            {/* 统计卡片 */}
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
                                    <dd className="text-lg font-medium text-gray-900">{stats.totalUsers}</dd>
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
                                    <dd className="text-lg font-medium text-gray-900">{stats.activeUsers}</dd>
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
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">待审核用户</dt>
                                    <dd className="text-lg font-medium text-gray-900">{stats.pendingUsers}</dd>
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
                                    <dd className="text-lg font-medium text-gray-900">{stats.totalReimbursements}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 快速操作 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">用户管理</h3>
                        <div className="space-y-3">
                            <Link
                                href="/admin/users"
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                            >
                                查看所有用户
                            </Link>
                            <Link
                                href="/admin/users?status=pending"
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                            >
                                待审核用户 ({stats.pendingUsers})
                            </Link>
                            <Link
                                href="/admin/users?role=admin"
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                            >
                                管理员列表
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">报销管理</h3>
                        <div className="space-y-3">
                            <Link
                                href="/admin/reimbursements"
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                            >
                                查看所有报销
                            </Link>
                            <Link
                                href="/admin/reimbursements?status=submitted"
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                            >
                                待审核报销 ({stats.pendingReimbursements})
                            </Link>
                            <Link
                                href="/admin/reimbursements?status=approved"
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                            >
                                已批准报销
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">数据分析</h3>
                        <div className="space-y-3">
                            <Link
                                href="/admin/analytics"
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                            >
                                数据分析报告
                            </Link>
                            <Link
                                href="/admin/analytics?export=csv"
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                            >
                                导出数据 (CSV)
                            </Link>
                            <Link
                                href="/admin/settings"
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                            >
                                系统设置
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* 系统信息 */}
            <div className="mt-8 bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">系统信息</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                            <span className="font-medium text-gray-500">系统版本：</span>
                            <span className="text-gray-900">v1.0.0</span>
                        </div>
                        <div>
                            <span className="font-medium text-gray-500">数据库：</span>
                            <span className="text-gray-900">PostgreSQL</span>
                        </div>
                        <div>
                            <span className="font-medium text-gray-500">部署环境：</span>
                            <span className="text-gray-900">Vercel</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
