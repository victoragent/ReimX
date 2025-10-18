"use client";

import { useState, useEffect } from "react";
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
        solanaAddress: ""
    });

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

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setEditForm({
            username: user.username,
            email: user.email,
            role: user.role,
            status: user.status,
            tgAccount: user.tgAccount || "",
            whatsappAccount: user.whatsappAccount || "",
            evmAddress: user.evmAddress || "",
            solanaAddress: user.solanaAddress || ""
        });
    };

    const handleSave = async () => {
        try {
            const response = await fetch("/api/admin/users", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: editingUser?.id,
                    ...editForm
                }),
            });

            const data = await response.json() as { error?: string };

            if (response.ok) {
                setEditingUser(null);
                fetchUsers();
            } else {
                setError(data.error || "更新失败");
            }
        } catch (error) {
            setError("网络错误，请重试");
        }
    };

    const handleDelete = async (userId: string) => {
        if (!confirm("确定要禁用此用户吗？")) return;

        try {
            const response = await fetch(`/api/admin/users?id=${userId}`, {
                method: "DELETE",
            });

            const data = await response.json() as { error?: string };

            if (response.ok) {
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
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
                    <p className="mt-4 text-gray-600">加载中...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 页面标题和操作栏 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
                        <p className="mt-1 text-gray-600">管理系统用户账户和权限</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-500">共 {pagination?.total || 0} 个用户</span>
                        <button
                            onClick={() => setEditingUser({
                                id: '',
                                username: '',
                                email: '',
                                role: 'user',
                                status: 'active',
                                tgAccount: '',
                                whatsappAccount: '',
                                evmAddress: '',
                                solanaAddress: '',
                                createdAt: '',
                                updatedAt: '',
                                _count: { reimbursements: 0 }
                            })}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            + 添加用户
                        </button>
                    </div>
                </div>
            </div>

            {/* 搜索和筛选 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {/* 搜索和筛选 */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input
                        type="text"
                        placeholder="搜索用户名或邮箱"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">所有角色</option>
                        <option value="user">用户</option>
                        <option value="reviewer">审核员</option>
                        <option value="admin">管理员</option>
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">所有状态</option>
                        <option value="active">正常</option>
                        <option value="pending">待审核</option>
                        <option value="suspended">已禁用</option>
                    </select>
                    <button
                        onClick={fetchUsers}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                        搜索
                    </button>
                </div>

                {error && (
                    <div className="mb-4 text-red-600 text-sm">{error}</div>
                )}

                {/* 用户列表 */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    用户信息
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    联系方式
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    区块链地址
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    角色/状态
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    报销数量
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    操作
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{user.username}</div>
                                            <div className="text-sm text-gray-500">{user.email}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div>{user.tgAccount && `TG: ${user.tgAccount}`}</div>
                                        <div>{user.whatsappAccount && `WA: ${user.whatsappAccount}`}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div>{user.evmAddress && `EVM: ${user.evmAddress.slice(0, 10)}...`}</div>
                                        <div>{user.solanaAddress && `SOL: ${user.solanaAddress.slice(0, 10)}...`}</div>
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
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {user._count.reimbursements}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => handleEdit(user)}
                                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                                        >
                                            编辑
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            禁用
                                        </button>
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
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                            >
                                上一页
                            </button>
                            <span className="px-3 py-2 text-sm text-gray-700">
                                第 {currentPage} 页，共 {pagination.pages} 页
                            </span>
                            <button
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={currentPage === pagination.pages}
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                            >
                                下一页
                            </button>
                        </nav>
                    </div>
                )}
            </div>

            {/* 编辑用户模态框 */}
            {editingUser && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">编辑用户</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">用户名</label>
                                    <input
                                        type="text"
                                        value={editForm.username}
                                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">邮箱</label>
                                    <input
                                        type="email"
                                        value={editForm.email}
                                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">角色</label>
                                    <select
                                        value={editForm.role}
                                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="user">用户</option>
                                        <option value="reviewer">审核员</option>
                                        <option value="admin">管理员</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">状态</label>
                                    <select
                                        value={editForm.status}
                                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="active">正常</option>
                                        <option value="pending">待审核</option>
                                        <option value="suspended">已禁用</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    onClick={() => setEditingUser(null)}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                >
                                    保存
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
}
