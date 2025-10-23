"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";

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
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password,
          tgAccount: form.tgAccount || undefined,
          whatsappAccount: form.whatsappAccount || undefined,
          evmAddress: form.evmAddress || undefined,
          solanaAddress: form.solanaAddress || undefined
        })
      });

      const data = await response.json() as { message?: string; error?: string };

      if (response.ok) {
        setSuccess(data.message || "注册成功，请等待管理员审核后再登录");
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
        setError("");
      } else {
        setError(data.error || "注册失败");
        setSuccess("");
      }
    } catch (err) {
      setError("网络错误，请重试");
      setSuccess("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="注册 ReimX 企业账户"
      description="完善组织成员资料，便于管理员快速审核。通过后即可访问控制台、提交报销并接收链上通知。"
    >
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-semibold text-slate-900">注册账户</h2>
          <p className="text-sm text-slate-600">注册后需要管理员审核通过才能登录</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50/80 px-5 py-4 text-sm text-red-700">
              <div className="flex items-start gap-3">
                <span className="font-semibold">注册失败</span>
                <span>{error}</span>
              </div>
            </div>
          ) : null}

          {success ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-5 py-4 text-sm text-emerald-700" role="status" aria-live="polite">
              <div className="flex flex-col gap-1">
                <h3 className="text-base font-semibold" id="register-success-heading">注册成功</h3>
                <p aria-describedby="register-success-heading">{success}</p>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="username" className="text-sm font-medium text-slate-700">
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
                className={`w-full rounded-xl border px-4 py-3 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 ${errors.username ? "border-red-300" : "border-slate-200"
                }`}
                placeholder="请输入用户名"
              />
              {errors.username ? <p className="text-xs text-red-600">{errors.username}</p> : null}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
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
                className={`w-full rounded-xl border px-4 py-3 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 ${errors.email ? "border-red-300" : "border-slate-200"
                }`}
                placeholder="请输入邮箱"
              />
              {errors.email ? <p className="text-xs text-red-600">{errors.email}</p> : null}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-slate-700">
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

                  const newErrors = { ...errors };
                  if (newPassword && newPassword.length < 6) {
                    newErrors.password = "密码至少6位";
                  } else if (newPassword && newPassword.length > 50) {
                    newErrors.password = "密码不能超过50位字符";
                  } else {
                    delete newErrors.password;
                  }

                  if (form.confirmPassword && newPassword !== form.confirmPassword) {
                    newErrors.confirmPassword = "两次输入的密码不一致";
                  } else if (form.confirmPassword && newPassword === form.confirmPassword) {
                    delete newErrors.confirmPassword;
                  }

                  setErrors(newErrors);
                }}
                className={`w-full rounded-xl border px-4 py-3 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 ${errors.password ? "border-red-300" : "border-slate-200"
                }`}
                placeholder="请输入密码（至少6位）"
              />
              {errors.password ? <p className="text-xs text-red-600">{errors.password}</p> : null}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                确认密码 *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={form.confirmPassword}
                onChange={(e) => {
                  const value = e.target.value;
                  setForm({ ...form, confirmPassword: value });

                  const newErrors = { ...errors };
                  if (value && value !== form.password) {
                    newErrors.confirmPassword = "两次输入的密码不一致";
                  } else {
                    delete newErrors.confirmPassword;
                  }
                  setErrors(newErrors);
                }}
                className={`w-full rounded-xl border px-4 py-3 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 ${errors.confirmPassword ? "border-red-300" : "border-slate-200"
                }`}
                placeholder="请再次输入密码"
              />
              {errors.confirmPassword ? (
                <p className="text-xs text-red-600">{errors.confirmPassword}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="tgAccount" className="text-sm font-medium text-slate-700">
                Telegram账号
              </label>
              <input
                id="tgAccount"
                name="tgAccount"
                type="text"
                value={form.tgAccount}
                onChange={(e) => setForm({ ...form, tgAccount: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="@username"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="whatsappAccount" className="text-sm font-medium text-slate-700">
                WhatsApp账号
              </label>
              <input
                id="whatsappAccount"
                name="whatsappAccount"
                type="text"
                value={form.whatsappAccount}
                onChange={(e) => setForm({ ...form, whatsappAccount: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="+86 138 0000 0000"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="evmAddress" className="text-sm font-medium text-slate-700">
                EVM地址
              </label>
              <input
                id="evmAddress"
                name="evmAddress"
                type="text"
                value={form.evmAddress}
                onChange={(e) => setForm({ ...form, evmAddress: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="0x..."
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="solanaAddress" className="text-sm font-medium text-slate-700">
                Solana地址
              </label>
              <input
                id="solanaAddress"
                name="solanaAddress"
                type="text"
                value={form.solanaAddress}
                onChange={(e) => setForm({ ...form, solanaAddress: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="Base58..."
              />
            </div>
          </div>

          <div className="space-y-4">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-black focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-60"
            >
              {loading ? "注册中..." : "注册"}
            </button>
            <p className="text-center text-sm text-slate-600">
              已有账户？{" "}
              <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                立即登录
              </Link>
            </p>
          </div>
        </form>
      </div>
    </AuthShell>
  );
}
