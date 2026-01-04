"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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

    const navigation = useMemo(
        () => [
            { name: "概览", href: "/admin", icon: "📊" },
            { name: "用户管理", href: "/admin/users", icon: "👥" },
            { name: "报销管理", href: "/admin/reimbursements", icon: "💰" },
            { name: "工资管理", href: "/admin/salaries", icon: "💼" },
            { name: "财务账本", href: "/admin/ledger", icon: "📒" },
            { name: "数据分析", href: "/admin/analytics", icon: "📈" }
        ],
        []
    );

    const normalizePath = (value: string) => {
        const trimmed = value.replace(/\/+$/, "");
        return trimmed.length > 0 ? trimmed : "/";
    };

    const currentPath = normalizePath(pathname);

    const isCurrentPath = (path: string) => {
        const target = normalizePath(path);
        if (target === "/admin") {
            return currentPath === "/admin";
        }
        return currentPath === target || currentPath.startsWith(`${target}/`);
    };

    if (status === "loading") {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-4 rounded-3xl border border-slate-200 bg-white/80 px-10 py-12 shadow-lg shadow-slate-200/70 backdrop-blur">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-500" />
                    <p className="text-sm font-medium text-slate-600">正在验证管理员身份...</p>
                </div>
            </div>
        );
    }

    if (status === "unauthenticated" || session?.user?.role !== "admin") {
        return null;
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-slate-50 to-slate-100 text-slate-900">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_120%_at_50%_-20%,rgba(79,70,229,0.18),rgba(14,165,233,0.12),transparent)]" />

            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <div className="relative flex min-h-screen">
                <aside
                    className={cn(
                        "fixed inset-y-4 left-4 z-50 flex w-72 flex-col rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-xl shadow-slate-200/50 backdrop-blur-2xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:inset-y-8 lg:left-8",
                        sidebarOpen ? "translate-x-0" : "-translate-x-[calc(100%+1.5rem)] lg:translate-x-0"
                    )}
                >
                    <div className="flex items-center justify-between">
                        <Link href="/admin" className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400 text-white shadow-lg shadow-indigo-200/70">
                                <span className="text-lg font-semibold">R</span>
                            </div>
                            <div>
                                <p className="text-sm font-semibold tracking-wide text-slate-900">ReimX Admin</p>
                                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Console</p>
                            </div>
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="rounded-full bg-slate-100 p-2 text-slate-500 hover:text-slate-900 lg:hidden"
                            aria-label="关闭菜单"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none">
                                <path
                                    d="M6 6l8 8m0-8l-8 8"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                    </div>

                    <div className="mt-8 rounded-2xl border border-slate-200/70 bg-white/85 p-4 shadow-sm shadow-slate-200/40">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                                <span className="text-base font-semibold">
                                    {session?.user?.name?.charAt(0) ?? "A"}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-900">
                                    {session?.user?.name ?? "Administrator"}
                                </p>
                                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Admin</p>
                            </div>
                        </div>
                    </div>

                    <nav className="mt-6 flex-1 space-y-1">
                        {navigation.map((item) => {
                            const active = isCurrentPath(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200",
                                        active
                                            ? "bg-gradient-to-r from-indigo-500/15 via-sky-500/15 to-cyan-500/10 text-slate-900 shadow-sm shadow-indigo-100"
                                            : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
                                    )}
                                >
                                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/85 text-base shadow-sm shadow-slate-200/60">
                                        {item.icon}
                                    </span>
                                    <span>{item.name}</span>
                                    {active && <span className="ml-auto h-2 w-2 rounded-full bg-indigo-500" />}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 text-center text-xs text-slate-500 shadow-sm shadow-slate-200/50">
                        <p>ReimX v1.0</p>
                        <p>Web3 Financial OS</p>
                    </div>
                </aside>

                <div className="flex flex-1 flex-col" id="admin-sub-page">
                    <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 px-4 py-4 shadow-sm shadow-slate-200/50 backdrop-blur lg:hidden">
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none">
                                    <path
                                        d="M3 6h14M3 10h14M3 14h14"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                                菜单
                            </button>
                            <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 shadow-sm">
                                {session?.user?.email}
                            </div>
                        </div>
                    </header>

                    <main className="flex-1">
                        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
