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
        <div className="min-h-screen bg-gray-50">
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
            <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200 relative">
                        <Link href="/admin" className="text-xl font-bold text-gray-900">
                            管理后台
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden absolute right-4 text-gray-500 hover:text-gray-700"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* 导航菜单 */}
                    <nav className="flex-1 px-4 py-6 space-y-2">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${isCurrentPath(item.href)
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                            >
                                <span className="mr-3 text-lg">{item.icon}</span>
                                {item.name}
                            </Link>
                        ))}
                    </nav>

                </div>
            </div>

            {/* 主内容区域 */}
            <div className="lg:pl-64">
                {/* 移动端菜单按钮 */}
                <div className="lg:hidden bg-white shadow-sm border-b border-gray-200">
                    <div className="px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-16">
                            <div className="flex items-center">
                                <button
                                    onClick={() => setSidebarOpen(true)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 页面内容 - 桌面端直接对齐，移动端有间距 */}
                <main className="flex-1 lg:mt-0">
                    {children}
                </main>
            </div>
        </div>
    );
}
