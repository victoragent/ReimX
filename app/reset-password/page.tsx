"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import Link from "next/link";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [formData, setFormData] = useState({
        newPassword: "",
        confirmPassword: "",
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [tokenValid, setTokenValid] = useState<boolean | null>(null);

    useEffect(() => {
        if (!token) {
            setError("无效的重置链接，请重新申请密码重置");
            setTokenValid(false);
        } else {
            setTokenValid(true);
        }
    }, [token]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setMessage("");

        if (!token) {
            setError("重置令牌无效");
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError("新密码和确认密码不匹配");
            return;
        }

        if (formData.newPassword.length < 6) {
            setError("新密码长度至少为6位");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    token,
                    newPassword: formData.newPassword,
                    confirmPassword: formData.confirmPassword,
                }),
            });

            const data = await response.json() as { error?: string; message?: string };

            if (response.ok) {
                setMessage("密码重置成功！正在跳转到登录页面...");
                setFormData({
                    newPassword: "",
                    confirmPassword: "",
                });

                // 3秒后跳转到登录页面
                setTimeout(() => {
                    router.push("/login?message=密码重置成功，请使用新密码登录");
                }, 3000);
            } else {
                setError(data.error || "密码重置失败");
                if (data.error?.includes("过期") || data.error?.includes("无效")) {
                    setTokenValid(false);
                }
            }
        } catch (err) {
            console.error("Reset password error:", err);
            setError("网络错误，请稍后重试");
        } finally {
            setLoading(false);
        }
    };

    if (tokenValid === false) {
        return (
            <AuthShell
                title="重置链接无效"
                description="密码重置链接已过期或无效，请重新申请密码重置。"
            >
                <div className="space-y-6">
                    <div className="rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700 text-center">
                        重置链接无效或已过期
                    </div>
                    <div className="space-y-4">
                        <Link
                            href="/forgot-password"
                            className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-black focus:outline-none focus:ring-2 focus:ring-slate-400 text-center"
                        >
                            重新申请密码重置
                        </Link>
                        <p className="text-center text-sm text-slate-600">
                            返回登录页面？{" "}
                            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                                立即登录
                            </Link>
                        </p>
                    </div>
                </div>
            </AuthShell>
        );
    }

    if (tokenValid === null) {
        return (
            <AuthShell title="重置密码" description="正在验证重置链接...">
                <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            </AuthShell>
        );
    }

    return (
        <AuthShell
            title="重置密码"
            description="请设置您的新密码，确保密码强度足够安全。"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1.5">
                    <label htmlFor="newPassword" className="text-sm font-medium text-slate-700">
                        新密码
                    </label>
                    <input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        required
                        value={formData.newPassword}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        placeholder="请输入新密码（至少6位）"
                    />
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                        确认新密码
                    </label>
                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        placeholder="请再次输入新密码"
                    />
                </div>

                {message ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-700 text-center">
                        {message}
                    </div>
                ) : null}

                {error ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700 text-center">
                        {error}
                    </div>
                ) : null}

                <div className="space-y-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-black focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-60"
                    >
                        {loading ? "重置中..." : "重置密码"}
                    </button>
                    <p className="text-center text-sm text-slate-600">
                        记起密码了？{" "}
                        <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                            返回登录
                        </Link>
                    </p>
                </div>
            </form>
        </AuthShell>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <AuthShell title="重置密码" description="正在加载...">
                <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            </AuthShell>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}
