"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface RegisterForm {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    tgAccount: string;
    whatsappAccount: string;
    evmAddress: string;
    solanaAddress: string;
}

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [form, setForm] = useState<RegisterForm>({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        tgAccount: "",
        whatsappAccount: "",
        evmAddress: "",
        solanaAddress: ""
    });

    const [errors, setErrors] = useState<Partial<RegisterForm>>({});

    const validateForm = () => {
        const newErrors: Partial<RegisterForm> = {};

        if (!form.username.trim()) {
            newErrors.username = "用户名不能为空";
        }

        if (!form.email.trim()) {
            newErrors.email = "邮箱不能为空";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            newErrors.email = "邮箱格式不正确";
        }

        if (!form.password) {
            newErrors.password = "密码不能为空";
        } else if (form.password.length < 6) {
            newErrors.password = "密码至少6位";
        } else if (form.password.length > 50) {
            newErrors.password = "密码不能超过50位字符";
        }

        if (!form.confirmPassword) {
            newErrors.confirmPassword = "确认密码不能为空";
        } else if (form.password !== form.confirmPassword) {
            newErrors.confirmPassword = "两次输入的密码不一致";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        if (!validateForm()) {
            setLoading(false);
            return;
        }

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: form.username,
                    email: form.email,
                    password: form.password,
                    tgAccount: form.tgAccount || undefined,
                    whatsappAccount: form.whatsappAccount || undefined,
                    evmAddress: form.evmAddress || undefined,
                    solanaAddress: form.solanaAddress || undefined,
                }),
            });

            const data = await response.json() as { message?: string; error?: string };

            if (response.ok) {
                setSuccess(data.message || "注册成功");
                setForm({
                    username: "",
                    email: "",
                    password: "",
                    confirmPassword: "",
                    tgAccount: "",
                    whatsappAccount: "",
                    evmAddress: "",
                    solanaAddress: ""
                });
            } else {
                setError(data.error || "注册失败");
            }
        } catch (error) {
            setError("网络错误，请重试");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        注册账户
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        注册后需要管理员审核通过才能登录
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">注册失败</h3>
                                    <div className="mt-2 text-sm text-red-700">{error}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-50 border border-green-200 rounded-md p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-green-800">注册成功</h3>
                                    <div className="mt-2 text-sm text-green-700">{success}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                                用户名 *
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                value={form.username}
                                onChange={(e) => {
                                    setForm({ ...form, username: e.target.value });
                                    if (errors.username) {
                                        setErrors({ ...errors, username: undefined });
                                    }
                                }}
                                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.username ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                placeholder="请输入用户名"
                            />
                            {errors.username && (
                                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                邮箱 *
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={form.email}
                                onChange={(e) => {
                                    setForm({ ...form, email: e.target.value });
                                    if (errors.email) {
                                        setErrors({ ...errors, email: undefined });
                                    }
                                }}
                                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.email ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                placeholder="请输入邮箱"
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                密码 *
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                minLength={6}
                                value={form.password}
                                onChange={(e) => {
                                    const newPassword = e.target.value;
                                    setForm({ ...form, password: newPassword });

                                    // 实时验证密码
                                    const newErrors = { ...errors };
                                    if (newPassword && newPassword.length < 6) {
                                        newErrors.password = "密码至少6位";
                                    } else if (newPassword && newPassword.length > 50) {
                                        newErrors.password = "密码不能超过50位字符";
                                    } else {
                                        delete newErrors.password;
                                    }

                                    // 如果密码改变，重新验证确认密码
                                    if (form.confirmPassword && newPassword !== form.confirmPassword) {
                                        newErrors.confirmPassword = "两次输入的密码不一致";
                                    } else if (form.confirmPassword && newPassword === form.confirmPassword) {
                                        delete newErrors.confirmPassword;
                                    }

                                    setErrors(newErrors);
                                }}
                                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.password ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                placeholder="请输入密码（至少6位）"
                            />
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                确认密码 *
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                                value={form.confirmPassword}
                                onChange={(e) => {
                                    const newConfirmPassword = e.target.value;
                                    setForm({ ...form, confirmPassword: newConfirmPassword });

                                    // 实时验证确认密码
                                    const newErrors = { ...errors };
                                    if (newConfirmPassword && form.password !== newConfirmPassword) {
                                        newErrors.confirmPassword = "两次输入的密码不一致";
                                    } else {
                                        delete newErrors.confirmPassword;
                                    }

                                    setErrors(newErrors);
                                }}
                                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                placeholder="请再次输入密码"
                            />
                            {errors.confirmPassword && (
                                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="tgAccount" className="block text-sm font-medium text-gray-700">
                                Telegram账号
                            </label>
                            <input
                                id="tgAccount"
                                name="tgAccount"
                                type="text"
                                value={form.tgAccount}
                                onChange={(e) => setForm({ ...form, tgAccount: e.target.value })}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="请输入Telegram账号（可选）"
                            />
                        </div>

                        <div>
                            <label htmlFor="whatsappAccount" className="block text-sm font-medium text-gray-700">
                                WhatsApp账号
                            </label>
                            <input
                                id="whatsappAccount"
                                name="whatsappAccount"
                                type="text"
                                value={form.whatsappAccount}
                                onChange={(e) => setForm({ ...form, whatsappAccount: e.target.value })}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="请输入WhatsApp账号（可选）"
                            />
                        </div>

                        <div>
                            <label htmlFor="evmAddress" className="block text-sm font-medium text-gray-700">
                                EVM地址
                            </label>
                            <input
                                id="evmAddress"
                                name="evmAddress"
                                type="text"
                                value={form.evmAddress}
                                onChange={(e) => setForm({ ...form, evmAddress: e.target.value })}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="请输入EVM地址（可选）"
                            />
                        </div>

                        <div>
                            <label htmlFor="solanaAddress" className="block text-sm font-medium text-gray-700">
                                Solana地址
                            </label>
                            <input
                                id="solanaAddress"
                                name="solanaAddress"
                                type="text"
                                value={form.solanaAddress}
                                onChange={(e) => setForm({ ...form, solanaAddress: e.target.value })}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="请输入Solana地址（可选）"
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "注册中..." : "注册"}
                        </button>
                    </div>

                    <div className="text-center">
                        <p className="text-sm text-gray-600">
                            已有账户？{" "}
                            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                                立即登录
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}