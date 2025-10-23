"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navigation() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLogout = async () => {
        await signOut({ callbackUrl: "/" });
    };

    // 防止水合错误，在客户端挂载前显示默认状态
    if (!mounted) {
        return (
            <nav className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <Link href="/" className="text-xl font-bold text-gray-900">
                                ReimX
                            </Link>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link
                                href="/login"
                                className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            >
                                登录
                            </Link>
                            <Link
                                href="/register"
                                className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-black focus:outline-none focus:ring-2 focus:ring-slate-400"
                            >
                                注册
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>
        );
    }

    if (status === "loading") {
        return (
            <nav className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <Link href="/" className="text-xl font-bold text-gray-900">
                                ReimX
                            </Link>
                        </div>
                        <div className="flex items-center">
                            <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
                        </div>
                    </div>
                </div>
            </nav>
        );
    }

    if (status === "unauthenticated") {
        return (
            <nav className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <Link href="/" className="text-xl font-bold text-gray-900">
                                ReimX
                            </Link>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link
                                href="/login"
                                className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            >
                                登录
                            </Link>
                            <Link
                                href="/register"
                                className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-black focus:outline-none focus:ring-2 focus:ring-slate-400"
                            >
                                注册
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>
        );
    }

    return (
        <nav className="bg-white shadow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link href="/" className="text-xl font-bold text-gray-900">
                            ReimX
                        </Link>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            <Link
                                href="/dashboard"
                                className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
                            >
                                控制台
                            </Link>
                            <Link
                                href="/reimbursements"
                                className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
                            >
                                报销申请
                            </Link>
                            <Link
                                href="/reimbursements/history"
                                className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
                            >
                                报销历史
                            </Link>
                            <Link
                                href="/profile"
                                className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
                            >
                                个人资料
                            </Link>
                            {session?.user?.role === "admin" && (
                                <Link
                                    href="/admin"
                                    className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
                                >
                                    管理后台
                                </Link>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center">
                        <span className="text-sm text-gray-700 mr-4">
                            欢迎，{session?.user?.name}
                        </span>
                        <button
                            onClick={handleLogout}
                            className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                        >
                            退出
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
