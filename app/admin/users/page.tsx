"use client";

import { useState, useEffect, useRef } from "react";
import type { ChangeEvent } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

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
    salaryUsdt: number;
    isApproved: boolean;
    approvedBy?: string;
    approvedAt?: string;
    createdAt: string;
    updatedAt: string;
    _count: {
        reimbursements: number;
    };
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

export default function AdminUsersPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editForm, setEditForm] = useState({
        username: "",
        email: "",
        role: "user",
        status: "active",
        tgAccount: "",
        whatsappAccount: "",
        evmAddress: "",
        solanaAddress: "",
        salaryUsdt: "",
        password: ""
    });
    const [approvingUser, setApprovingUser] = useState<User | null>(null);
    const [approveForm, setApproveForm] = useState({
        approved: true,
        role: "user"
    });
    const [statusModal, setStatusModal] = useState<{
        user: User;
        targetStatus: "active" | "suspended";
    } | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [importing, setImporting] = useState(false);
    const [importSummary, setImportSummary] = useState<string | null>(null);
    const isCreatingUser = editingUser?.id === "";

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
            fetchUsers();
        }
    }, [status, session?.user?.role, currentPage, searchTerm, roleFilter, statusFilter]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: "10",
                ...(searchTerm && { search: searchTerm }),
                ...(roleFilter && { role: roleFilter }),
                ...(statusFilter && { status: statusFilter })
            });

            const response = await fetch(`/api/admin/users?${params}`);
            const data = await response.json() as { users?: User[]; pagination?: Pagination; error?: string };

            if (response.ok) {
                setUsers(data.users!);
                setPagination(data.pagination!);
            } else {
                setError(data.error || "获取用户列表失败");
            }
        } catch (error) {
            setError("网络错误，请重试");
        } finally {
            setLoading(false);
        }
    };

    const handleImportChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        if (!/\.(xlsx|xls)$/i.test(file.name)) {
            setImportSummary("仅支持 .xlsx 或 .xls 格式文件");
            event.target.value = "";
            return;
        }

        setImporting(true);
        setImportSummary(null);
        setError("");

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/admin/users/import", {
                method: "POST",
                body: formData
            });

            const result = await response.json() as { created?: number; skipped?: number; errors?: Array<{ row: number; message: string }>; error?: string };

            if (!response.ok) {
                setError(result.error || "导入失败，请检查文件内容");
            } else {
                const baseSummary = `成功导入 ${result.created ?? 0} 个用户，跳过 ${result.skipped ?? 0} 个。`;
                const issues = (result.errors ?? []).slice(0, 3).map((item) => `第 ${item.row} 行：${item.message}`);
                const issueText = issues.length ? ` ${issues.join('；')}${(result.errors ?? []).length > 3 ? ' ...' : ''}` : '';
                setImportSummary(baseSummary + issueText);
                await fetchUsers();
            }
        } catch (error) {
            setError("导入失败，请重试");
        } finally {
            setImporting(false);
            event.target.value = "";
        }
    };


    const handleEdit = (user: User) => {
        setError("");
        setEditingUser(user);
        setEditForm({
            username: user.username,
            email: user.email,
            role: user.role,
            status: user.status,
            tgAccount: user.tgAccount || "",
            whatsappAccount: user.whatsappAccount || "",
            evmAddress: user.evmAddress || "",
            solanaAddress: user.solanaAddress || "",
            salaryUsdt: user.salaryUsdt ? user.salaryUsdt.toString() : "",
            password: ""
        });
    };

    const handleApprove = (user: User) => {
        setApprovingUser({
            ...user,
            isApproved: user.isApproved || false,
            approvedBy: user.approvedBy || undefined,
            approvedAt: user.approvedAt || undefined
        });
        setApproveForm({
            approved: true,
            role: user.role
        });
    };

    const handleApproveUser = async () => {
        if (!approvingUser) return;

        try {
            const response = await fetch(`/api/admin/users/${approvingUser.id}/approve`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(approveForm),
            });

            const data = await response.json() as { error?: string };

            if (response.ok) {
                setApprovingUser(null);
                fetchUsers();
            } else {
                setError(data.error || "审核用户失败");
            }
        } catch (error) {
            setError("网络错误，请重试");
        }
    };

    const handleSave = async () => {
        setError("");
        try {
            if (!editingUser) return;

            const isNewUser = !editingUser.id;

            const payload: Record<string, unknown> = {
                username: editForm.username,
                email: editForm.email,
                role: editForm.role,
                status: editForm.status,
                tgAccount: editForm.tgAccount || undefined,
                whatsappAccount: editForm.whatsappAccount || undefined,
                evmAddress: editForm.evmAddress || undefined,
                solanaAddress: editForm.solanaAddress || undefined
            };

            if (editForm.salaryUsdt !== "") {
                const parsed = Number(editForm.salaryUsdt);
                payload.salaryUsdt = Number.isFinite(parsed) ? parsed : 0;
            }

            let method: "POST" | "PUT" = "PUT";

            if (isNewUser) {
                const password = editForm.password.trim();
                if (!password) {
                    setError("请为新用户设置初始密码");
                    return;
                }
                payload.password = password;
                method = "POST";
            } else {
                payload.id = editingUser.id;
                // 如状态未变更，则移除 role/status 以避免触发不必要的审核
                if (editForm.role === editingUser.role) {
                    delete payload.role;
                }
                if (editForm.status === editingUser.status) {
                    delete payload.status;
                }
            }

            const response = await fetch("/api/admin/users", {
                method,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json() as { error?: string };

            if (response.ok) {
                setEditingUser(null);
                setEditForm({
                    username: "",
                    email: "",
                    role: "user",
                    status: "active",
                    tgAccount: "",
                    whatsappAccount: "",
                    evmAddress: "",
                    solanaAddress: "",
                    salaryUsdt: "",
                    password: ""
                });
                fetchUsers();
            } else {
                setError(data.error || (isNewUser ? "创建用户失败" : "更新失败"));
            }
        } catch (error) {
            setError("网络错误，请重试");
        }
    };

    const handleStatusChange = async () => {
        if (!statusModal) return;

        try {
            setError("");
            const response = await fetch("/api/admin/users", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    id: statusModal.user.id,
                    status: statusModal.targetStatus,
                    isApproved: statusModal.targetStatus === "active"
                })
            });

            const data = await response.json() as { error?: string };

            if (response.ok) {
                setStatusModal(null);
                fetchUsers();
            } else {
                setError(data.error || "操作失败");
            }
        } catch (error) {
            setError("网络错误，请重试");
        }
    };

    if (status === "loading" || loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4 rounded-3xl border border-slate-200 bg-white/80 px-10 py-12 shadow-lg shadow-slate-200/70 backdrop-blur">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-500" />
                    <p className="text-sm font-medium text-slate-600">加载中...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* 页面标题和操作栏 */}
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm shadow-slate-200/50 backdrop-blur">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">用户管理</h1>
                        <p className="mt-1 text-sm text-slate-600">管理系统用户账户和权限</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs font-medium uppercase tracking-[0.3em] text-slate-500">
                            共 {pagination?.total || 0} 个用户
                        </span>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={importing}
                            className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {importing ? "导入中..." : "导入 Excel"}
                        </button>
                        <button
                            onClick={() => {
                                setEditingUser({
                                    id: '',
                                    username: '',
                                    email: '',
                                    role: 'user',
                                    status: 'active',
                                    tgAccount: '',
                                    whatsappAccount: '',
                                    evmAddress: '',
                                    solanaAddress: '',
                                    salaryUsdt: 0,
                                    createdAt: '',
                                    updatedAt: '',
                                    _count: { reimbursements: 0 },
                                    isApproved: false
                                });
                                setEditForm({
                                    username: '',
                                    email: '',
                                    role: 'user',
                                    status: 'active',
                                    tgAccount: '',
                                    whatsappAccount: '',
                                    evmAddress: '',
                                    solanaAddress: '',
                                    salaryUsdt: '',
                                    password: ''
                                });
                                setError("");
                            }}
                            className="inline-flex items-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-black"
                        >
                            + 添加用户
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls"
                            className="hidden"
                            onChange={handleImportChange}
                        />
                    </div>
                    {importSummary && (
                        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
                            {importSummary}
                        </div>
                    )}
                </div>
            </div>

            {/* 搜索和筛选 */}
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm shadow-slate-200/50 backdrop-blur">
                {/* 搜索和筛选 */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input
                        type="text"
                        placeholder="搜索用户名或邮箱"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                    />
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                    >
                        <option value="">所有角色</option>
                        <option value="user">用户</option>
                        <option value="reviewer">审核员</option>
                        <option value="admin">管理员</option>
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                    >
                        <option value="">所有状态</option>
                        <option value="active">正常</option>
                        <option value="pending">待审核</option>
                        <option value="suspended">已禁用</option>
                    </select>
                    <button
                        onClick={fetchUsers}
                        className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-black"
                    >
                        搜索
                    </button>
                </div>

                {error && (
                    <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                        {error}
                    </div>
                )}

                {/* 用户列表 */}
                <div className="overflow-x-auto rounded-3xl border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200 bg-white/70">
                        <thead className="bg-slate-50/80">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                                    用户信息
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                                    联系方式
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                                    区块链地址
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                                    工资 (USDT)
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                                    角色/状态
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                                    报销数量
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                                    操作
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {users.map((user) => (
                                <tr key={user.id} className="transition hover:bg-slate-50/70">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-slate-900">{user.username}</div>
                                            <div className="text-sm text-slate-500">{user.email}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        <div>{user.tgAccount && `TG: ${user.tgAccount}`}</div>
                                        <div>{user.whatsappAccount && `WA: ${user.whatsappAccount}`}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        <div>{user.evmAddress && `EVM: ${user.evmAddress.slice(0, 10)}...`}</div>
                                        <div>{user.solanaAddress && `SOL: ${user.solanaAddress.slice(0, 10)}...`}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                        {typeof user.salaryUsdt === "number" ? user.salaryUsdt.toFixed(2) : "—"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded-full text-xs ${user.role === "admin" ? "bg-red-100 text-red-800" :
                                            user.role === "reviewer" ? "bg-yellow-100 text-yellow-800" :
                                                "bg-green-100 text-green-800"
                                            }`}>
                                            {user.role === "admin" ? "管理员" :
                                                user.role === "reviewer" ? "审核员" : "用户"}
                                        </span>
                                        <br />
                                        <span className={`px-2 py-1 rounded-full text-xs ${user.status === "active" ? "bg-green-100 text-green-800" :
                                            user.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                                                "bg-red-100 text-red-800"
                                            }`}>
                                            {user.status === "active" ? "正常" :
                                                user.status === "pending" ? "待审核" : "已禁用"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {user._count.reimbursements}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex flex-wrap gap-2">
                                            {!user.isApproved && user.status === "pending" && (
                                                <button
                                                    onClick={() => handleApprove(user)}
                                                    className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600 transition hover:bg-emerald-100"
                                                >
                                                    审核
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleEdit(user)}
                                                className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                                            >
                                                编辑
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setError("");
                                                    setStatusModal({
                                                        user,
                                                        targetStatus: user.status === "suspended" ? "active" : "suspended"
                                                    });
                                                }}
                                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition ${user.status === "suspended"
                                                        ? "border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                                        : "border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                                                    }`}
                                            >
                                                {user.status === "suspended" ? "解禁" : "禁用"}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* 分页 */}
                {pagination && pagination.pages > 1 && (
                    <div className="mt-6 flex justify-center">
                        <nav className="flex space-x-2">
                            <button
                                onClick={() => setCurrentPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:border-slate-300 disabled:opacity-50 disabled:hover:border-slate-200"
                            >
                                上一页
                            </button>
                            <span className="px-3 py-2 text-sm text-slate-700">
                                第 {currentPage} 页，共 {pagination.pages} 页
                            </span>
                            <button
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={currentPage === pagination.pages}
                                className="rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:border-slate-300 disabled:opacity-50 disabled:hover:border-slate-200"
                            >
                                下一页
                            </button>
                        </nav>
                    </div>
                )}
            </div>

            {/* 编辑用户模态框 */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
                    <div className="relative mx-4 w-full max-w-4xl">
                        <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-indigo-200/40 blur-3xl" />
                        <div className="absolute -right-16 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-sky-200/30 blur-3xl" />
                        <div className="relative rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-2xl">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-semibold text-slate-900">
                                        {isCreatingUser ? "创建新用户" : "编辑用户资料"}
                                    </h3>
                                    <p className="text-sm text-slate-600">
                                        {isCreatingUser
                                            ? "为团队成员创建账户，并设置初始登录信息。敏感字段保存后将进入管理员审核流程。"
                                            : "调整角色与联系方式，修改敏感字段后用户会重新进入待审核状态。"}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setEditingUser(null)}
                                    className="rounded-full border border-slate-200 bg-white/80 p-2 text-slate-500 transition hover:text-slate-900"
                                    aria-label="关闭"
                                >
                                    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
                                        <path d="M4 4l8 8m0-8l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                </button>
                            </div>

                            <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">用户名</label>
                                    <input
                                        type="text"
                                        value={editForm.username}
                                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">邮箱</label>
                                    <input
                                        type="email"
                                        value={editForm.email}
                                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">角色</label>
                                    <select
                                        value={editForm.role}
                                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                    >
                                        <option value="user">用户</option>
                                        <option value="reviewer">审核员</option>
                                        <option value="admin">管理员</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">状态</label>
                                    <select
                                        value={editForm.status}
                                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                    >
                                        <option value="active">正常</option>
                                        <option value="pending">待审核</option>
                                        <option value="suspended">已禁用</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Telegram</label>
                                    <input
                                        type="text"
                                        value={editForm.tgAccount}
                                        onChange={(e) => setEditForm({ ...editForm, tgAccount: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                        placeholder="@username"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">WhatsApp</label>
                                    <input
                                        type="text"
                                        value={editForm.whatsappAccount}
                                        onChange={(e) => setEditForm({ ...editForm, whatsappAccount: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                        placeholder="+86 138 0000 0000"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">EVM 地址</label>
                                    <input
                                        type="text"
                                        value={editForm.evmAddress}
                                        onChange={(e) => setEditForm({ ...editForm, evmAddress: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                        placeholder="0x..."
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Solana 地址</label>
                                    <input
                                        type="text"
                                        value={editForm.solanaAddress}
                                        onChange={(e) => setEditForm({ ...editForm, solanaAddress: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                        placeholder="Base58..."
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">工资 (USDT)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={editForm.salaryUsdt}
                                        onChange={(e) => setEditForm({ ...editForm, salaryUsdt: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                        placeholder="仅管理员可设置"
                                    />
                                </div>
                                {isCreatingUser && (
                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="text-sm font-medium text-slate-700">初始密码</label>
                                        <input
                                            type="password"
                                            value={editForm.password}
                                            onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                            placeholder="为新用户设置登录密码"
                                        />
                                        <p className="text-xs text-slate-500">管理员创建用户时需提供初始密码，用户可在登录后修改。</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 flex flex-col items-center justify-between gap-3 md:flex-row">
                                <div className="text-xs text-slate-500">
                                    提示：若修改邮箱或链上地址，系统将把该用户状态重置为待审核。
                                </div>
                                <div className="flex w-full gap-3 md:w-auto">
                                    <button
                                        onClick={() => setEditingUser(null)}
                                        className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 md:flex-none"
                                    >
                                        取消
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="inline-flex flex-1 items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-black md:flex-none"
                                    >
                                        保存
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 审核用户模态框 */}
            {approvingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
                    <div className="relative mx-4 w-full max-w-xl">
                        <div className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-indigo-200/40 blur-3xl" />
                        <div className="absolute -right-12 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-emerald-200/30 blur-3xl" />
                        <div className="relative rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-2xl">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-semibold text-slate-900">审核用户</h3>
                                    <p className="text-sm text-slate-600">
                                        用户：{approvingUser.username} ({approvingUser.email})
                                    </p>
                                </div>
                                <button
                                    onClick={() => setApprovingUser(null)}
                                    className="rounded-full border border-slate-200 bg-white/80 p-2 text-slate-500 transition hover:text-slate-900"
                                    aria-label="关闭"
                                >
                                    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
                                        <path d="M4 4l8 8m0-8l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                </button>
                            </div>

                            <div className="mt-6 space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">审核结果</label>
                                    <select
                                        value={approveForm.approved ? "approved" : "rejected"}
                                        onChange={(e) => setApproveForm({
                                            ...approveForm,
                                            approved: e.target.value === "approved"
                                        })}
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                    >
                                        <option value="approved">通过</option>
                                        <option value="rejected">拒绝</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">分配角色</label>
                                    <select
                                        value={approveForm.role}
                                        onChange={(e) => setApproveForm({ ...approveForm, role: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                    >
                                        <option value="user">普通用户</option>
                                        <option value="reviewer">审核员</option>
                                        <option value="admin">管理员</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <p className="text-xs text-slate-500">
                                    通过审核将同步激活账户，并记录审核人及审核时间。
                                </p>
                                <div className="flex w-full gap-3 md:w-auto">
                                    <button
                                        onClick={() => setApprovingUser(null)}
                                        className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 md:flex-none"
                                    >
                                        取消
                                    </button>
                                    <button
                                        onClick={handleApproveUser}
                                        className="inline-flex flex-1 items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 md:flex-none"
                                    >
                                        确认审核
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 状态变更模态框 */}
            {statusModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
                    <div className="relative mx-4 w-full max-w-lg">
                        <div className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-rose-200/40 blur-3xl" />
                        <div className="absolute -right-10 top-1/2 h-36 w-36 -translate-y-1/2 rounded-full bg-emerald-200/40 blur-3xl" />
                        <div className="relative rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-2xl">
                            <div className="space-y-3 text-center">
                                <h3 className="text-2xl font-semibold text-slate-900">
                                    {statusModal.targetStatus === "suspended" ? "禁用用户" : "解禁用户"}
                                </h3>
                                <p className="text-sm text-slate-600">
                                    {statusModal.targetStatus === "suspended"
                                        ? "禁用后该用户将无法登录或提交报销，您可随时重新启用。"
                                        : "确认解禁该账户？用户将恢复正常访问和审批权限。"}
                                </p>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-slate-700">
                                    <p className="font-medium">{statusModal.user.username}</p>
                                    <p className="text-xs text-slate-500">{statusModal.user.email}</p>
                                </div>
                            </div>
                            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
                                <button
                                    onClick={() => setStatusModal(null)}
                                    className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 sm:w-auto"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handleStatusChange}
                                    className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition sm:w-auto ${statusModal.targetStatus === "suspended"
                                            ? "bg-rose-600 hover:bg-rose-700"
                                            : "bg-emerald-600 hover:bg-emerald-700"
                                        }`}
                                >
                                    确认{statusModal.targetStatus === "suspended" ? "禁用" : "解禁"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
