"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
            void fetchStats();
        }
    }, [status, session?.user?.role, router]);

    const fetchStats = async () => {
        try {
            const response = await fetch("/api/admin/stats");
            const data = (await response.json()) as { stats?: any; error?: string };

            if (response.ok && data.stats) {
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
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4 rounded-3xl border border-slate-200 bg-white/80 px-10 py-12 shadow-lg shadow-slate-200/70 backdrop-blur">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-500" />
                    <p className="text-sm font-medium text-slate-600">正在加载管理数据...</p>
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="rounded-3xl border border-rose-200 bg-white/80 px-8 py-10 text-center text-rose-600 shadow-lg shadow-rose-100/60 backdrop-blur">
                获取统计数据失败，请稍后重试。
            </div>
        );
    }

    const lastUpdated = new Date().toLocaleString("zh-CN", { hour12: false });

    return (
        <div className="space-y-10">
            <section className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-lg shadow-slate-200/60 backdrop-blur">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">管理概览</h1>
                        <p className="text-sm text-slate-600 sm:text-base">
                            欢迎回来，{session?.user?.name ?? "管理员"}。在这里掌控用户、报销、工资与分析。
                        </p>
                        <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-medium text-slate-600 shadow-sm">
                            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                            系统运行正常 · 最后更新 {lastUpdated}
                        </div>
                    </div>
                    <div className="rounded-3xl border border-indigo-200/60 bg-gradient-to-br from-indigo-500 via-sky-500 to-cyan-400 px-6 py-5 text-white shadow-lg shadow-indigo-200/70">
                        <p className="text-xs uppercase tracking-[0.3em] text-white/80">Today</p>
                        <p className="mt-2 text-2xl font-semibold">
                            {stats.totalReimbursements} 条报销记录
                        </p>
                        <p className="text-sm text-white/80">
                            累计金额 ${stats.totalAmount.toFixed(2)} USD
                        </p>
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    title="总用户"
                    value={stats.totalUsers.toString()}
                    hint={`活跃用户 ${stats.activeUsers}`}
                    tone="indigo"
                    icon={
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                    }
                />
                <MetricCard
                    title="待审核用户"
                    value={stats.pendingUsers.toString()}
                    hint="需要尽快处理"
                    tone="amber"
                    icon={
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                />
                <MetricCard
                    title="报销记录"
                    value={stats.totalReimbursements.toString()}
                    hint={`待审核 ${stats.pendingReimbursements}`}
                    tone="sky"
                    icon={
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    }
                />
                <MetricCard
                    title="总金额"
                    value={`$${stats.totalAmount.toFixed(2)}`}
                    hint="单位 USD"
                    tone="emerald"
                    icon={
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                    }
                />
            </section>

            <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <QuickPanel
                    gradient="from-indigo-500 via-indigo-500 to-sky-500"
                    title="用户管理"
                    icon={
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                    }
                    links={[
                        { href: "/admin/users", label: "查看所有用户" },
                        { href: "/admin/users?status=pending", label: "待审核用户", badge: stats.pendingUsers.toString(), tone: "amber" },
                        { href: "/admin/users?role=admin", label: "管理员列表" }
                    ]}
                />
                <QuickPanel
                    gradient="from-blue-500 via-sky-500 to-cyan-500"
                    title="报销管理"
                    icon={
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    }
                    links={[
                        { href: "/admin/reimbursements", label: "查看所有报销" },
                        { href: "/admin/reimbursements?status=submitted", label: "待审核报销", badge: stats.pendingReimbursements.toString(), tone: "sky" },
                        { href: "/admin/reimbursements/safewallet", label: "Safe Wallet 批付" }
                    ]}
                />
                <QuickPanel
                    gradient="from-emerald-500 via-teal-500 to-green-500"
                    title="工资与系统"
                    icon={
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                    }
                    links={[
                        { href: "/admin/salaries", label: "工资发放工作台" },
                        { href: "/admin/analytics", label: "数据分析仪表盘" },
                        { href: "#", label: "系统设置", disabled: true }
                    ]}
                />
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm shadow-slate-200/50">
                <h3 className="text-lg font-semibold text-slate-900">系统状态</h3>
                <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
                    <StatusChip label="系统版本" value="v1.0.0" tone="emerald" />
                    <StatusChip label="数据库" value="PostgreSQL" tone="sky" />
                    <StatusChip label="部署环境" value="Vercel" tone="violet" />
                </div>
            </section>
        </div>
    );
}

function MetricCard({
    title,
    value,
    hint,
    tone,
    icon
}: {
    title: string;
    value: string;
    hint: string;
    tone: "indigo" | "amber" | "sky" | "emerald";
    icon: ReactNode;
}) {
    const colors = {
        indigo: "bg-indigo-100 text-indigo-600",
        amber: "bg-amber-100 text-amber-600",
        sky: "bg-sky-100 text-sky-600",
        emerald: "bg-emerald-100 text-emerald-600"
    } as const;

    return (
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm shadow-slate-200/50 transition hover:shadow-md hover:shadow-slate-200/70">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-500">{title}</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
                    <p className="mt-1 text-xs text-slate-500">{hint}</p>
                </div>
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", colors[tone])}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

function QuickPanel({
    gradient,
    title,
    icon,
    links
}: {
    gradient: string;
    title: string;
    icon: ReactNode;
    links: Array<{ href: string; label: string; badge?: string; tone?: "emerald" | "amber" | "sky" | "slate"; disabled?: boolean }>;
}) {
    return (
        <div className="space-y-6 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm shadow-slate-200/50">
            <div className={cn("rounded-2xl px-6 py-4 text-white shadow-lg shadow-indigo-200/60", `bg-gradient-to-r ${gradient}`)}>
                <h3 className="flex items-center text-lg font-semibold">
                    <span className="mr-2">{icon}</span>
                    {title}
                </h3>
            </div>
            <div className="space-y-3">
                {links.map((link) => (
                    <QuickLink
                        key={link.label}
                        href={link.href}
                        label={link.label}
                        badge={link.badge}
                        badgeTone={link.tone}
                        disabled={link.disabled}
                    />
                ))}
            </div>
        </div>
    );
}

function QuickLink({
    href,
    label,
    badge,
    badgeTone = "slate",
    disabled
}: {
    href: string;
    label: string;
    badge?: string;
    badgeTone?: "emerald" | "amber" | "sky" | "slate";
    disabled?: boolean;
}) {
    const toneMap: Record<typeof badgeTone, string> = {
        emerald: "bg-emerald-100 text-emerald-700",
        amber: "bg-amber-100 text-amber-700",
        sky: "bg-sky-100 text-sky-700",
        slate: "bg-slate-100 text-slate-600"
    } as const;

    const content = (
        <span className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white">
            <span>{label}</span>
            <span className="flex items-center gap-2 text-xs text-slate-400">
                {badge && (
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", toneMap[badgeTone])}>
                        {badge}
                    </span>
                )}
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
            </span>
        </span>
    );

    if (disabled) {
        return (
            <span className="flex cursor-not-allowed items-center justify-between gap-3 rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-3 text-sm font-medium text-slate-400">
                {label}
                <span className="text-xs text-slate-300">即将推出</span>
            </span>
        );
    }

    return (
        <Link href={href} className="block">
            {content}
        </Link>
    );
}

function StatusChip({ label, value, tone }: { label: string; value: string; tone: "emerald" | "sky" | "violet" }) {
    const dotClass =
        tone === "emerald" ? "bg-emerald-500" : tone === "sky" ? "bg-sky-500" : "bg-violet-500";

    return (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 shadow-sm shadow-slate-200/40">
            <span className={cn("h-2 w-2 rounded-full", dotClass)} />
            <div>
                <p className="text-xs font-medium uppercase tracking-[0.3em] text-slate-500">
                    {label}
                </p>
                <p className="text-sm font-semibold text-slate-900">{value}</p>
            </div>
        </div>
    );
}
