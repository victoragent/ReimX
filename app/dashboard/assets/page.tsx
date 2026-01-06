"use client";

import { useEffect, useState } from "react";
import { AssetCard } from "@/components/assets/asset-card";
import { AssetForm } from "@/components/assets/asset-form";
import { Plus, X, PieChart, Coins } from "lucide-react";

export default function AssetsPage() {
    const [assets, setAssets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const fetchAssets = async () => {
        try {
            setIsLoading(true);
            const res = await fetch("/api/assets");
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

    // Simple Calculate Total Value (Rough estimate, ignoring currency conversion for UI demo)
    // Real implementation should convert to common currency.
    const totalAssets = assets.length;

    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-8 lg:px-12 bg-white min-h-screen text-black">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-5">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-black">资产管理</h1>
                    <p className="mt-2 text-sm text-gray-500">追踪您的固定资产与投资净值</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                >
                    <Plus className="h-4 w-4" />
                    新建资产
                </button>
            </div>

            {/* Overview Stats (Placeholder for now) */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-6">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                            <Coins className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">资产总数</p>
                            <h3 className="text-2xl font-bold text-gray-900">{totalAssets}</h3>
                        </div>
                    </div>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-6">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                            <PieChart className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">总估值 (Est)</p>
                            <h3 className="text-2xl font-bold text-gray-900">Pending...</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* List */}
            {isLoading ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-48 animate-pulse rounded-2xl bg-gray-100" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {assets.map((asset) => (
                        <AssetCard key={asset.id} asset={asset} />
                    ))}
                    {assets.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-400">
                            暂无资产，请点击右上角创建
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px] p-4 transition-all">
                    <div className="relative w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-8 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute right-5 top-5 inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-black"
                        >
                            <X className="h-4 w-4" />
                        </button>
                        <div className="mb-8">
                            <h2 className="text-xl font-bold tracking-tight text-black">新建资产</h2>
                            <p className="mt-1 text-sm text-gray-500">录入新的固定资产或投资持仓</p>
                        </div>
                        <AssetForm onSuccess={() => {
                            setShowModal(false);
                            fetchAssets();
                        }} />
                    </div>
                </div>
            )}
        </div>
    );
}
