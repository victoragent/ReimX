"use client";

import { useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setLoading(true);

        try {
            const response = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json() as { error?: string; message?: string };

            if (response.ok) {
                setMessage("密码重置链接已发送到您的邮箱，请查收并按照说明重置密码。");
            } else {
                setError(data.error || "发送失败，请稍后重试");
            }
        } catch (err) {
            setError("网络错误，请稍后重试");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell
            title="找回密码"
            description="输入您的邮箱地址，我们将发送密码重置链接到您的邮箱。"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1.5">
                    <label htmlFor="email" className="text-sm font-medium text-slate-700">
                        邮箱地址
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        placeholder="请输入注册时使用的邮箱地址"
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
                        {loading ? "发送中..." : "发送重置链接"}
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

