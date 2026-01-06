"use client";

import { useEffect, useState } from "react";
import { AssetCard } from "@/components/assets/asset-card";
import { Search } from "lucide-react";

export default function AdminAssetsPage() {
    const [assets, setAssets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchUser, setSearchUser] = useState("");

    const fetchAssets = async () => {
        try {
            setIsLoading(true);
            const res = await fetch("/api/assets"); // Admin gets all by default
            if (res.ok) {
                const data = await res.json();
                setAssets(data as any[]);
            }
        } catch (error) {
            console.error("Failed to fetch assets", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAssets();
    }, []);

    const filteredAssets = assets.filter(a =>
        a.name.toLowerCase().includes(searchUser.toLowerCase()) ||
        a.user?.username.toLowerCase().includes(searchUser.toLowerCase())
    );

    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-8 lg:px-12 bg-white min-h-screen text-black">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-5">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-black">全局资产管理</h1>
                    <p className="mt-2 text-sm text-gray-500">查看全公司所有员工的资产状况</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="搜索资产名称或所属员工..."
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                />
            </div>

            {/* List */}
            {isLoading ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="h-48 animate-pulse rounded-2xl bg-gray-100" />
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredAssets.map((asset) => (
                        <div key={asset.id} className="relative">
                            <div className="absolute -top-3 -right-3 z-10 rounded-full bg-black px-3 py-1 text-xs font-medium text-white shadow-sm">
                                {asset.user?.username || "Unknown"}
                            </div>
                            <AssetCard asset={asset} />
                        </div>
                    ))}
                    {filteredAssets.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-400">
                            未找到资产
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
