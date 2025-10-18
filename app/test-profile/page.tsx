"use client";

import { useState } from "react";
import { signIn, useSession } from "next-auth/react";

export default function TestProfilePage() {
    const { data: session, status } = useSession();
    const [email, setEmail] = useState("test@example.com");
    const [password, setPassword] = useState("password123");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);

        try {
            const res = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            setResult(res);
        } catch (error) {
            setResult({ error: error.message });
        } finally {
            setLoading(false);
        }
    };

    const testProfileAPI = async () => {
        try {
            const response = await fetch("/api/users/profile");
            const data = await response.json();
            setResult({ profile: data, status: response.status });
        } catch (error) {
            setResult({ error: error.message });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-2xl mx-auto px-4">
                <h1 className="text-2xl font-bold mb-6">测试个人资料功能</h1>

                <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">会话状态</h2>
                    <pre className="bg-gray-100 p-4 rounded text-sm">
                        {JSON.stringify({ status, session }, null, 2)}
                    </pre>
                </div>

                {status === "unauthenticated" && (
                    <div className="bg-white shadow rounded-lg p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">登录测试</h2>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    邮箱
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    密码
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {loading ? "登录中..." : "登录"}
                            </button>
                        </form>
                    </div>
                )}

                {status === "authenticated" && (
                    <div className="bg-white shadow rounded-lg p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">个人资料 API 测试</h2>
                        <button
                            onClick={testProfileAPI}
                            className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                        >
                            测试个人资料 API
                        </button>
                    </div>
                )}

                {result && (
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-lg font-semibold mb-4">测试结果</h2>
                        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}
