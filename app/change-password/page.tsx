"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import Link from "next/link";

export default function ChangePasswordPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [formData, setFormData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login?message=请先登录");
        }
    }, [status, router]);

    if (status === "loading") {
        return (
            <AuthShell title="修改密码" description="正在加载...">
                <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            </AuthShell>
        );
    }

    if (status === "unauthenticated") {
        return null;
    }

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
            console.log("Submitting password change request...");
            const response = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            console.log("Response status:", response.status);
            const data = await response.json() as { error?: string; message?: string };
            console.log("Response data:", data);

            if (response.ok) {
                setMessage("密码修改成功！");
                setFormData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                });
            } else {
                setError(data.error || "密码修改失败");
            }
        } catch (err) {
            console.error("Password change error:", err);
            setError("网络错误，请稍后重试");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell
            title="修改密码"
            description="为了账户安全，请定期更新您的密码。"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1.5">
                    <label htmlFor="currentPassword" className="text-sm font-medium text-slate-700">
                        当前密码
                    </label>
                    <input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        required
                        value={formData.currentPassword}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        placeholder="请输入当前密码"
                    />
                </div>

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
                        {loading ? "修改中..." : "修改密码"}
                    </button>
                    <div className="flex justify-center space-x-4 text-sm">
                        <Link href="/profile" className="font-medium text-indigo-600 hover:text-indigo-500">
                            返回个人资料
                        </Link>
                        <span className="text-slate-400">|</span>
                        <Link href="/dashboard" className="font-medium text-indigo-600 hover:text-indigo-500">
                            返回控制台
                        </Link>
                    </div>
                </div>
            </form>
        </AuthShell>
    );
}
