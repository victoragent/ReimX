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
    chainAddresses?: Record<string, unknown> | null;
    role: string;
    status: string;
    isApproved?: boolean;
    salaryUsdt?: number | null;
    createdAt: string;
    updatedAt: string;
}

type ChainAddressEntry = {
    chain: string;
    address: string;
};

const chainOptions = [
    { value: "evm", label: "EVM 通用" },
    { value: "eth", label: "Ethereum" },
    { value: "bsc", label: "BSC" },
    { value: "polygon", label: "Polygon" },
    { value: "arbitrum", label: "Arbitrum" },
    { value: "base", label: "Base" },
    { value: "solana", label: "Solana" }
] as const;

const evmChains = ["eth", "evm", "bsc", "polygon", "arbitrum", "base"] as const;

const isStringRecord = (value: unknown): value is Record<string, string> => {
    if (!value || typeof value !== "object") {
        return false;
    }

    return Object.values(value).every((item) => typeof item === "string");
};

const extractChainEntries = (user: User): ChainAddressEntry[] => {
    const unique = new Map<string, string>();
    let chainValue: unknown = user.chainAddresses;

    if (typeof chainValue === "string") {
        const trimmed = chainValue.trim();
        if (trimmed) {
            try {
                chainValue = JSON.parse(trimmed);
            } catch {
                chainValue = null;
            }
        } else {
            chainValue = null;
        }
    }

    if (Array.isArray(chainValue)) {
        for (const entry of chainValue) {
            if (!entry || typeof entry !== "object") {
                continue;
            }

            const chain = "chain" in entry ? (entry as { chain?: unknown }).chain : undefined;
            const address = "address" in entry ? (entry as { address?: unknown }).address : undefined;

            if (typeof chain === "string" && typeof address === "string") {
                const normalizedChain = chain.trim().toLowerCase();
                const trimmedAddress = address.trim();
                if (normalizedChain && trimmedAddress) {
                    unique.set(normalizedChain, trimmedAddress);
                }
            }
        }
    } else if (isStringRecord(chainValue)) {
        for (const [chain, address] of Object.entries(chainValue)) {
            if (typeof address === "string") {
                const normalizedChain = chain.trim().toLowerCase();
                const trimmedAddress = address.trim();
                if (normalizedChain && trimmedAddress) {
                    unique.set(normalizedChain, trimmedAddress);
                }
            }
        }
    } else if (chainValue && typeof chainValue === "object") {
        for (const [chain, value] of Object.entries(chainValue as Record<string, unknown>)) {
            if (
                value &&
                typeof value === "object" &&
                "address" in value &&
                typeof (value as { address?: unknown }).address === "string"
            ) {
                const address = (value as { address: string }).address.trim();
                const normalizedChain = chain.trim().toLowerCase();
                if (normalizedChain && address) {
                    unique.set(normalizedChain, address);
                }
            }
        }
    }

    if (user.evmAddress && !unique.has("evm")) {
        unique.set("evm", user.evmAddress);
    }

    if (user.solanaAddress && !unique.has("solana")) {
        unique.set("solana", user.solanaAddress);
    }

    return Array.from(unique.entries()).map(([chain, address]) => ({
        chain,
        address
    }));
};

const deriveLegacyAddresses = (entries: ChainAddressEntry[]) => {
    const trimmed = entries
        .map((entry) => ({
            chain: entry.chain.trim().toLowerCase(),
            address: entry.address.trim()
        }))
        .filter((entry) => entry.chain && entry.address);

    const evmAddress =
        trimmed.find((entry) => evmChains.includes(entry.chain as (typeof evmChains)[number]))?.address ?? "";
    const solanaAddress = trimmed.find((entry) => entry.chain === "solana")?.address ?? "";

    return { evmAddress, solanaAddress, entries: trimmed };
};

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
        whatsappAccount: ""
    });
    const [chainAddresses, setChainAddresses] = useState<ChainAddressEntry[]>([]);

    const resetFeedback = () => {
        setError("");
        setSuccess("");
    };

    const handleAddChainAddress = () => {
        resetFeedback();
        setChainAddresses((prev) => {
            const used = new Set(prev.map((entry) => entry.chain));
            const available = chainOptions.find((option) => !used.has(option.value));

            if (!available) {
                setError("所有支持的链均已添加，如需修改请先删除现有链。");
                return prev;
            }

            return [...prev, { chain: available.value, address: "" }];
        });
    };

    const handleChainSelectionChange = (index: number, chain: string) => {
        resetFeedback();
        setChainAddresses((prev) => {
            if (prev.some((entry, idx) => idx !== index && entry.chain === chain)) {
                setError("每条链只能保存一个地址，请先删除已存在的链。");
                return prev;
            }

            const next = [...prev];
            next[index] = { ...next[index], chain };
            return next;
        });
    };

    const handleChainAddressInputChange = (index: number, address: string) => {
        resetFeedback();
        setChainAddresses((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], address };
            return next;
        });
    };

    const handleRemoveChainAddress = (index: number) => {
        resetFeedback();
        setChainAddresses((prev) => prev.filter((_, idx) => idx !== index));
    };

    const canAddMoreChains = chainOptions.some(
        (option) => !chainAddresses.some((entry) => entry.chain === option.value)
    );

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
                    whatsappAccount: data.user.whatsappAccount || ""
                });
                setChainAddresses(extractChainEntries(data.user));
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
            const sanitizedChainEntries: ChainAddressEntry[] = chainAddresses.map((entry) => ({
                chain: entry.chain.trim().toLowerCase(),
                address: entry.address.trim()
            }));

            const seenChains = new Set<string>();
            for (const entry of sanitizedChainEntries) {
                if (!entry.chain) {
                    setError("请选择链类型");
                    setSaving(false);
                    return;
                }

                if (!entry.address) {
                    setError("链上地址不能为空");
                    setSaving(false);
                    return;
                }

                if (seenChains.has(entry.chain)) {
                    setError("每条链只能保存一个地址，请检查重复项。");
                    setSaving(false);
                    return;
                }

                seenChains.add(entry.chain);
            }

            const { evmAddress, solanaAddress, entries } = deriveLegacyAddresses(sanitizedChainEntries);

            const payload: Record<string, unknown> = {
                ...formData,
                chainAddresses: entries
            };

            payload.evmAddress = evmAddress;
            payload.solanaAddress = solanaAddress;

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
                    whatsappAccount: data.user.whatsappAccount || ""
                });
                setChainAddresses(extractChainEntries(data.user));
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
            <p className="text-sm font-medium text-slate-700">标准月薪</p>
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
            <p className="text-sm font-medium text-slate-700">状态</p>
            <div className="mt-2 text-sm text-slate-700">{statusPill}</div>
        </div>,
        <div
            key="role"
            className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur"
        >
            <p className="text-sm font-medium text-slate-700">角色</p>
            <div className="mt-2 text-sm text-slate-700">{rolePill}</div>
        </div>,
        <div
            key="createdAt"
            className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur"
        >
            <p className="text-sm font-medium text-slate-700">注册时间</p>
            <div className="mt-2 text-sm text-slate-700">
                {new Date(user.createdAt).toLocaleDateString()}
            </div>
        </div>,
        <div
            key="email"
            className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur"
        >
            <p className="text-sm font-medium text-slate-700">邮箱</p>
            <div className="mt-2 text-sm text-slate-700 break-all">{user.email}</div>
        </div>
    ];

    return (
        <AuthShell
            title="个人资料"
            description="更新您的联系方式、链上地址与角色申请，保证账户信息始终准确可追踪。"
            illustration={(
                <div className="space-y-3 text-sm text-slate-600">
                    {highlightCards}
                </div>
            )}
        >
            <form onSubmit={handleSubmit} className="space-y-6" id="profile-form">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2" id="profile-fields">
                    <div className="space-y-1.5" id="username-field">
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
                    <div className="space-y-1.5" id="email-field">
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
                        <div className="space-y-1.5" id="role-field">
                            <label htmlFor="role" className="text-sm font-medium text-slate-700">
                                角色
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
                    <div className="space-y-1.5" id="telegram-field">
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
                    <div className="space-y-1.5" id="whatsapp-field">
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
                    <div className="md:col-span-2 space-y-3" id="chain-addresses-section">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between" id="chain-addresses-header">
                            <div>
                                <span className="text-sm font-medium text-slate-700">链上收款地址</span>
                                <p className="text-xs text-slate-500 mt-1">
                                    每条链仅可保存一个地址。
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddChainAddress}
                                disabled={!canAddMoreChains}
                                id="add-chain-address-btn"
                                className={`inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium shadow-sm transition ${canAddMoreChains
                                    ? "bg-slate-900 text-white hover:bg-slate-500"
                                    : "bg-slate-100 text-slate-400 cursor-not-allowed opacity-60"
                                    }`}
                            >
                                新增地址
                            </button>
                        </div>
                        {chainAddresses.length > 0 ? (
                            <div className="space-y-3" id="chain-addresses-list">
                                {chainAddresses.map((entry, index) => {
                                    const usedChains = new Set(
                                        chainAddresses
                                            .filter((_, idx) => idx !== index)
                                            .map((item) => item.chain)
                                    );
                                    const selectId = `chain-select-${index}`;
                                    const addressId = `chain-address-${index}`;

                                    return (
                                        <div
                                            key={`${entry.chain}-${index}`}
                                            id={`chain-address-item-${index}`}
                                            className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-4 shadow-sm backdrop-blur"
                                        >
                                            <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                                                <div className="lg:w-26 xl:w-26">
                                                    <label
                                                        htmlFor={selectId}
                                                        className="mb-1 block text-xs font-medium text-slate-500"
                                                    >
                                                        链类型
                                                    </label>
                                                    <select
                                                        id={selectId}
                                                        value={entry.chain}
                                                        onChange={(event) =>
                                                            handleChainSelectionChange(index, event.target.value)
                                                        }
                                                        className="w-full rounded-xl border border-slate-200 px-2 py-2 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                                    >
                                                        {chainOptions.map((option) => (
                                                            <option
                                                                key={option.value}
                                                                value={option.value}
                                                                disabled={usedChains.has(option.value)}
                                                            >
                                                                {option.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <label
                                                        htmlFor={addressId}
                                                        className="mb-1 block text-xs font-medium text-slate-500"
                                                    >
                                                        收款地址
                                                    </label>
                                                    <input
                                                        id={addressId}
                                                        type="text"
                                                        value={entry.address}
                                                        onChange={(event) =>
                                                            handleChainAddressInputChange(index, event.target.value)
                                                        }
                                                        placeholder={entry.chain === "solana" ? "Base58..." : "0x..."}
                                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 font-mono"
                                                        title={entry.address || "请输入收款地址"}
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveChainAddress(index)}
                                                    id={`remove-chain-address-${index}`}
                                                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-rose-500 shadow-sm transition hover:bg-rose-50 lg:self-end lg:shrink-0"
                                                >
                                                    移除
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div id="no-chain-addresses-message" className="rounded-2xl border border-dashed border-slate-200 bg-white/50 p-6 text-xs text-slate-500">
                                当前尚未保存链上地址，点击"新增链地址"进行配置。
                            </div>
                        )}
                    </div>
                </div>

                {error ? (
                    <div id="error-message" className="rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                ) : null}

                {success ? (
                    <div id="success-message" className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-700">
                        {success}
                    </div>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" id="action-section">
                    <div className="space-y-1 text-xs text-slate-500" id="action-info">
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
                    <div className="flex flex-col gap-3 sm:flex-row sm:w-auto" id="action-buttons">
                        <button
                            type="submit"
                            disabled={saving}
                            id="save-changes-btn"
                            className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-black sm:w-auto disabled:opacity-60"
                        >
                            {saving ? "保存中..." : "保存更改"}
                        </button>
                        <button
                            type="button"
                            onClick={handleLogout}
                            id="logout-btn"
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
