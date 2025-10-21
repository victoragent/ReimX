"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";

interface User {
    id: string;
    username: string;
    email: string;
    tgAccount?: string;
    whatsappAccount?: string;
    evmAddress?: string;
    solanaAddress?: string;
    role: string;
    status: string;
    isApproved?: boolean;
    salaryUsdt?: number | null;
    createdAt: string;
    updatedAt: string;
}

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        role: "user",
        tgAccount: "",
        whatsappAccount: "",
        evmAddress: "",
        solanaAddress: ""
    });

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
            return;
        }

        if (status === "authenticated") {
            void fetchUserProfile();
        }
    }, [status, router]);

    const fetchUserProfile = async () => {
        try {
            const response = await fetch("/api/users/profile");
            const data = await response.json() as { user?: User; error?: string };

            if (response.ok && data.user) {
                setUser(data.user);
                setFormData({
                    username: data.user.username,
                    email: data.user.email,
                    role: data.user.role,
                    tgAccount: data.user.tgAccount || "",
                    whatsappAccount: data.user.whatsappAccount || "",
                    evmAddress: data.user.evmAddress || "",
                    solanaAddress: data.user.solanaAddress || ""
                });
            } else {
                setError(data.error || "获取用户信息失败");
            }
        } catch (err) {
            setError("网络错误，请重试");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setSaving(true);

        // Ensure user exists before proceeding
        if (!user) {
            setError("获取用户信息失败，请刷新后重试");
            setSaving(false);
            return;
        }

        try {
            const payload: Record<string, unknown> = { ...formData };

            if (user.role === "admin") {
                delete payload.role;
            } else if (payload.role === user.role) {
                delete payload.role;
            }

            const response = await fetch("/api/users/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json() as { user?: User; error?: string; message?: string };

            if (response.ok && data.user) {
                setSuccess(data.message || "更新成功");
                setUser(data.user);
                setFormData({
                    username: data.user.username,
                    email: data.user.email,
                    role: data.user.role,
                    tgAccount: data.user.tgAccount || "",
                    whatsappAccount: data.user.whatsappAccount || "",
                    evmAddress: data.user.evmAddress || "",
                    solanaAddress: data.user.solanaAddress || ""
                });
            } else {
                setError(data.error || "更新失败");
            }
        } catch (err) {
            setError("网络错误，请重试");
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await signOut({ callbackUrl: "/login" });
    };

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-slate-50 to-slate-100">
                <div className="text-center">
                    <div className="mb-4 inline-flex h-14 w-14 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-500" />
                    <p className="text-sm text-slate-500">加载中...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <AuthShell
                title="个人资料"
                description="我们无法获取到您的账户信息，请重新登录后再试。"
            >
                <div className="rounded-3xl border border-red-200 bg-red-50/80 px-6 py-8 text-center text-sm text-red-700">
                    <p className="font-medium">获取用户信息失败</p>
                    <button
                        onClick={() => router.push("/login")}
                        className="mt-4 inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-black"
                    >
                        返回登录
                    </button>
                </div>
            </AuthShell>
        );
    }

    const rolePill = (
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${user.role === "admin"
            ? "bg-red-100 text-red-700"
            : user.role === "reviewer"
                ? "bg-amber-100 text-amber-700"
                : "bg-emerald-100 text-emerald-700"
            }`}>
            {user.role === "admin" ? "管理员" : user.role === "reviewer" ? "审核员" : "用户"}
        </span>
    );

    const statusPill = (
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${user.status === "active"
            ? "bg-emerald-100 text-emerald-700"
            : user.status === "pending"
                ? "bg-amber-100 text-amber-700"
                : "bg-rose-100 text-rose-700"
            }`}>
            {user.status === "active" ? "正常" : user.status === "pending" ? "待审核" : "已禁用"}
        </span>
    );

    const salaryValue =
        typeof user.salaryUsdt === "number" ? `${user.salaryUsdt.toFixed(2)} USDT` : "未设置";

    const highlightCards = [
        <div
            key="salary"
            className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur"
        >
            <p className="text-xs uppercase tracking-wide text-indigo-500">标准月薪</p>
            <div className="mt-2 text-lg font-semibold text-slate-900">{salaryValue}</div>
            {typeof user.salaryUsdt === "number" && user.salaryUsdt > 0 ? (
                <Link
                    href="/salary"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                >
                    查看工资发放记录
                    <span aria-hidden>→</span>
                </Link>
            ) : (
                <p className="mt-2 text-xs text-slate-500">尚未设置，请联系管理员配置工资信息。</p>
            )}
        </div>,
        <div
            key="status"
            className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur"
        >
            <p className="text-xs uppercase tracking-wide text-indigo-500">状态</p>
            <div className="mt-2 text-sm text-slate-700">{statusPill}</div>
        </div>,
        <div
            key="role"
            className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur"
        >
            <p className="text-xs uppercase tracking-wide text-indigo-500">角色</p>
            <div className="mt-2 text-sm text-slate-700">{rolePill}</div>
        </div>,
        <div
            key="createdAt"
            className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur"
        >
            <p className="text-xs uppercase tracking-wide text-indigo-500">注册时间</p>
            <div className="mt-2 text-sm text-slate-700">
                {new Date(user.createdAt).toLocaleDateString()}
            </div>
        </div>,
        <div
            key="email"
            className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur"
        >
            <p className="text-xs uppercase tracking-wide text-indigo-500">邮箱</p>
            <div className="mt-2 text-sm text-slate-700 break-all">{user.email}</div>
        </div>
    ];

    return (
        <AuthShell
            title="个人资料"
            description="更新您的联系方式、链上地址与角色申请，保证账户信息始终准确可追踪。"
            illustration={(
                <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                    {highlightCards}
                </div>
            )}
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div className="space-y-1.5">
                        <label htmlFor="username" className="text-sm font-medium text-slate-700">
                            用户名
                        </label>
                        <input
                            type="text"
                            name="username"
                            id="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            required
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label htmlFor="email" className="text-sm font-medium text-slate-700">
                            邮箱
                        </label>
                        <input
                            type="email"
                            name="email"
                            id="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            required
                        />
                        <p className="text-xs text-slate-500">修改邮箱后需要管理员再次审核。</p>
                    </div>
                    {user.role !== "admin" && (
                        <div className="space-y-1.5">
                            <label htmlFor="role" className="text-sm font-medium text-slate-700">
                                角色申请
                            </label>
                            <select
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            >
                                <option value="user">普通用户</option>
                                <option value="reviewer">审核员（申请提升）</option>
                            </select>
                            <p className="text-xs text-slate-500">角色变更需管理员确认后生效。</p>
                        </div>
                    )}
                    <div className="space-y-1.5">
                        <label htmlFor="tgAccount" className="text-sm font-medium text-slate-700">
                            Telegram 账号
                        </label>
                        <input
                            type="text"
                            name="tgAccount"
                            id="tgAccount"
                            value={formData.tgAccount}
                            onChange={handleChange}
                            placeholder="@username"
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label htmlFor="whatsappAccount" className="text-sm font-medium text-slate-700">
                            WhatsApp 账号
                        </label>
                        <input
                            type="text"
                            name="whatsappAccount"
                            id="whatsappAccount"
                            value={formData.whatsappAccount}
                            onChange={handleChange}
                            placeholder="+86 138 0000 0000"
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label htmlFor="evmAddress" className="text-sm font-medium text-slate-700">
                            EVM 地址
                        </label>
                        <input
                            type="text"
                            name="evmAddress"
                            id="evmAddress"
                            value={formData.evmAddress}
                            onChange={handleChange}
                            placeholder="0x..."
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label htmlFor="solanaAddress" className="text-sm font-medium text-slate-700">
                            Solana 地址
                        </label>
                        <input
                            type="text"
                            name="solanaAddress"
                            id="solanaAddress"
                            value={formData.solanaAddress}
                            onChange={handleChange}
                            placeholder="Base58..."
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                    </div>
                </div>

                {error ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                ) : null}

                {success ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-700">
                        {success}
                    </div>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1 text-xs text-slate-500">
                        <p>提示：修改邮箱或链上地址后，账户将自动设为待审核状态。</p>
                        {typeof user.salaryUsdt === "number" && user.salaryUsdt > 0 ? (
                            <p>
                                想查看工资发放记录？
                                <Link
                                    href="/salary"
                                    className="ml-1 inline-flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-700"
                                >
                                    前往工资中心
                                    <span aria-hidden>→</span>
                                </Link>
                            </p>
                        ) : null}
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:w-auto">
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-black sm:w-auto disabled:opacity-60"
                        >
                            {saving ? "保存中..." : "保存更改"}
                        </button>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 sm:w-auto"
                        >
                            退出登录
                        </button>
                    </div>
                </div>
            </form>
        </AuthShell>
    );
}
