"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
            return;
        }

        if (status === "authenticated" && session?.user?.role !== "admin") {
            router.push("/dashboard");
            return;
        }
    }, [status, session, router]);

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

    if (status === "unauthenticated" || session?.user?.role !== "admin") {
        return null;
    }

    const navigation = [
        { name: "概览", href: "/admin", icon: "📊" },
        { name: "用户管理", href: "/admin/users", icon: "👥" },
        { name: "报销管理", href: "/admin/reimbursements", icon: "💰" },
        { name: "数据分析", href: "/admin/analytics", icon: "📈" },
    ];

    const isCurrentPath = (path: string) => {
        if (path === "/admin") {
            return pathname === "/admin";
        }
        return pathname.startsWith(path);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* 移动端侧边栏遮罩 */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                >
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-75"></div>
                </div>
            )}

            {/* 侧边栏 */}
            <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                <div className="flex flex-col h-full">
                    {/* Logo区域 */}
                    <div className="flex items-center justify-between h-20 px-6 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600">
                        <Link href="/admin" className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                                <span className="text-indigo-600 font-bold text-lg">R</span>
                            </div>
                            <div>
                                <h1 className="text-white font-bold text-lg">ReimX</h1>
                                <p className="text-indigo-100 text-xs">管理后台</p>
                            </div>
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden text-white hover:text-indigo-200 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* 用户信息 */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                <span className="text-indigo-600 font-semibold text-sm">
                                    {session?.user?.name?.charAt(0) || 'A'}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">{session?.user?.name}</p>
                                <p className="text-xs text-gray-500">管理员</p>
                            </div>
                        </div>
                    </div>

                    {/* 导航菜单 */}
                    <nav className="flex-1 px-4 py-6 space-y-1">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${isCurrentPath(item.href)
                                    ? 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-500'
                                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                            >
                                <span className="mr-3 text-xl">{item.icon}</span>
                                <span className="flex-1">{item.name}</span>
                                {isCurrentPath(item.href) && (
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                                )}
                            </Link>
                        ))}
                    </nav>

                    {/* 底部信息 */}
                    <div className="px-4 py-4 border-t border-gray-200">
                        <div className="text-xs text-gray-500 text-center">
                            <p>ReimX v1.0</p>
                            <p>Web3 报销系统</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 主内容区域 */}
            <div className="flex-1 flex flex-col">
                {/* 顶部导航栏 */}
                <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
                    <div className="px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            <div className="flex items-center">
                                <button
                                    onClick={() => setSidebarOpen(true)}
                                    className="lg:hidden text-gray-500 hover:text-gray-700 p-2 rounded-md hover:bg-gray-100"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </button>
                                <div className="hidden lg:block">
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        {navigation.find(item => isCurrentPath(item.href))?.name || '管理后台'}
                                    </h2>
                                </div>
                            </div>
                            
                            <div className="flex items-center space-x-4">
                                {/* 通知按钮 */}
                                <button className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 7l2.586 2.586a2 2 0 002.828 0L12 7H4.828z" />
                                    </svg>
                                </button>
                                
                                {/* 用户菜单 */}
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                        <span className="text-indigo-600 font-semibold text-sm">
                                            {session?.user?.name?.charAt(0) || 'A'}
                                        </span>
                                    </div>
                                    <span className="hidden sm:block text-sm font-medium text-gray-700">
                                        {session?.user?.name}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 页面内容 */}
                <main className="flex-1">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
