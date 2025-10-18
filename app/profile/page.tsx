"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
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
            fetchUserProfile();
        }
    }, [status, router]);

    const fetchUserProfile = async () => {
        try {
            console.log("Fetching user profile...", { session });
            const response = await fetch("/api/users/profile");
            const data = await response.json();

            console.log("Profile API response:", { status: response.status, data });

            if (response.ok) {
                setUser(data.user);
                setFormData({
                    username: data.user.username,
                    tgAccount: data.user.tgAccount || "",
                    whatsappAccount: data.user.whatsappAccount || "",
                    evmAddress: data.user.evmAddress || "",
                    solanaAddress: data.user.solanaAddress || ""
                });
            } else {
                console.error("Profile API error:", data);
                setError(data.error || "获取用户信息失败");
            }
        } catch (error) {
            console.error("Network error:", error);
            setError("网络错误，请重试");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

        try {
            const response = await fetch("/api/users/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(data.message);
                setUser(data.user);
            } else {
                setError(data.error || "更新失败");
            }
        } catch (error) {
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
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
                    <p className="mt-4 text-gray-600">加载中...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600">获取用户信息失败</p>
                    <button
                        onClick={() => router.push("/login")}
                        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                        返回登录
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h1 className="text-2xl font-bold text-gray-900 mb-6">个人资料</h1>

                        <div className="mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-medium text-gray-500">角色：</span>
                                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${user.role === "admin" ? "bg-red-100 text-red-800" :
                                            user.role === "reviewer" ? "bg-yellow-100 text-yellow-800" :
                                                "bg-green-100 text-green-800"
                                        }`}>
                                        {user.role === "admin" ? "管理员" :
                                            user.role === "reviewer" ? "审核员" : "用户"}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-500">状态：</span>
                                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${user.status === "active" ? "bg-green-100 text-green-800" :
                                            user.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                                                "bg-red-100 text-red-800"
                                        }`}>
                                        {user.status === "active" ? "正常" :
                                            user.status === "pending" ? "待审核" : "已禁用"}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-500">邮箱：</span>
                                    <span className="ml-2">{user.email}</span>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-500">注册时间：</span>
                                    <span className="ml-2">{new Date(user.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                                        用户名
                                    </label>
                                    <input
                                        type="text"
                                        name="username"
                                        id="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="tgAccount" className="block text-sm font-medium text-gray-700">
                                        Telegram 账号
                                    </label>
                                    <input
                                        type="text"
                                        name="tgAccount"
                                        id="tgAccount"
                                        value={formData.tgAccount}
                                        onChange={handleChange}
                                        placeholder="@username"
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="whatsappAccount" className="block text-sm font-medium text-gray-700">
                                        WhatsApp 账号
                                    </label>
                                    <input
                                        type="text"
                                        name="whatsappAccount"
                                        id="whatsappAccount"
                                        value={formData.whatsappAccount}
                                        onChange={handleChange}
                                        placeholder="+86 138 0000 0000"
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="evmAddress" className="block text-sm font-medium text-gray-700">
                                        EVM 地址
                                    </label>
                                    <input
                                        type="text"
                                        name="evmAddress"
                                        id="evmAddress"
                                        value={formData.evmAddress}
                                        onChange={handleChange}
                                        placeholder="0x..."
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="solanaAddress" className="block text-sm font-medium text-gray-700">
                                        Solana 地址
                                    </label>
                                    <input
                                        type="text"
                                        name="solanaAddress"
                                        id="solanaAddress"
                                        value={formData.solanaAddress}
                                        onChange={handleChange}
                                        placeholder="Base58..."
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="text-red-600 text-sm">{error}</div>
                            )}

                            {success && (
                                <div className="text-green-600 text-sm">{success}</div>
                            )}

                            <div className="flex justify-between">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {saving ? "保存中..." : "保存更改"}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                                >
                                    退出登录
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
