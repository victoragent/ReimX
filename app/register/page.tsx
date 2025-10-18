"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        tgAccount: "",
        whatsappAccount: "",
        evmAddress: "",
        solanaAddress: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [confirmPasswordError, setConfirmPasswordError] = useState("");

    const validatePassword = (password: string) => {
        if (password.length < 6) {
            return "密码至少需要6位字符";
        }
        if (password.length > 50) {
            return "密码不能超过50位字符";
        }
        return "";
    };

    const validateConfirmPassword = (password: string, confirmPassword: string) => {
        if (confirmPassword && password !== confirmPassword) {
            return "两次输入的密码不一致";
        }
        return "";
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });

        // 实时验证密码
        if (name === "password") {
            const error = validatePassword(value);
            setPasswordError(error);

            // 如果确认密码已输入，重新验证
            if (formData.confirmPassword) {
                const confirmError = validateConfirmPassword(value, formData.confirmPassword);
                setConfirmPasswordError(confirmError);
            }
        }

        // 实时验证确认密码
        if (name === "confirmPassword") {
            const error = validateConfirmPassword(formData.password, value);
            setConfirmPasswordError(error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        // 验证密码
        const passwordValidationError = validatePassword(formData.password);
        if (passwordValidationError) {
            setPasswordError(passwordValidationError);
            setLoading(false);
            return;
        }

        // 验证确认密码
        const confirmPasswordValidationError = validateConfirmPassword(formData.password, formData.confirmPassword);
        if (confirmPasswordValidationError) {
            setConfirmPasswordError(confirmPasswordValidationError);
            setLoading(false);
            return;
        }

        // 清除验证错误
        setPasswordError("");
        setConfirmPasswordError("");

        try {
            const response = await fetch("/api/users/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    tgAccount: formData.tgAccount || undefined,
                    whatsappAccount: formData.whatsappAccount || undefined,
                    evmAddress: formData.evmAddress || undefined,
                    solanaAddress: formData.solanaAddress || undefined
                }),
            });

            const data = await response.json() as { error?: string };

            if (response.ok) {
                router.push("/login?message=注册成功，请登录");
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
                        已有账户？{" "}
                        <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                            立即登录
                        </Link>
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
                                value={formData.username}
                                onChange={handleChange}
                                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="请输入用户名"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                邮箱地址 *
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="请输入邮箱地址"
                            />
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
                                value={formData.password}
                                onChange={handleChange}
                                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${passwordError ? 'border-red-300' : 'border-gray-300'
                                    } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                                placeholder="请输入密码（至少6位）"
                            />
                            {passwordError && (
                                <p className="mt-1 text-sm text-red-600">{passwordError}</p>
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
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${confirmPasswordError ? 'border-red-300' : 'border-gray-300'
                                    } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                                placeholder="请再次输入密码"
                            />
                            {confirmPasswordError && (
                                <p className="mt-1 text-sm text-red-600">{confirmPasswordError}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label htmlFor="tgAccount" className="block text-sm font-medium text-gray-700">
                                    Telegram 账号
                                </label>
                                <input
                                    id="tgAccount"
                                    name="tgAccount"
                                    type="text"
                                    value={formData.tgAccount}
                                    onChange={handleChange}
                                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                    placeholder="@username"
                                />
                            </div>

                            <div>
                                <label htmlFor="whatsappAccount" className="block text-sm font-medium text-gray-700">
                                    WhatsApp 账号
                                </label>
                                <input
                                    id="whatsappAccount"
                                    name="whatsappAccount"
                                    type="text"
                                    value={formData.whatsappAccount}
                                    onChange={handleChange}
                                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                    placeholder="+86 138 0000 0000"
                                />
                            </div>

                            <div>
                                <label htmlFor="evmAddress" className="block text-sm font-medium text-gray-700">
                                    EVM 地址
                                </label>
                                <input
                                    id="evmAddress"
                                    name="evmAddress"
                                    type="text"
                                    value={formData.evmAddress}
                                    onChange={handleChange}
                                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                    placeholder="0x..."
                                />
                            </div>

                            <div>
                                <label htmlFor="solanaAddress" className="block text-sm font-medium text-gray-700">
                                    Solana 地址
                                </label>
                                <input
                                    id="solanaAddress"
                                    name="solanaAddress"
                                    type="text"
                                    value={formData.solanaAddress}
                                    onChange={handleChange}
                                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                    placeholder="Base58..."
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-600 text-sm text-center">{error}</div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {loading ? "注册中..." : "注册"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
