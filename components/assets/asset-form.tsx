"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AssetForm({ onSuccess }: { onSuccess: () => void }) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get("name"),
            type: formData.get("type"),
            currency: formData.get("currency"),
            initialValue: Number(formData.get("initialValue")),
            quantity: formData.get("quantity") ? Number(formData.get("quantity")) : undefined,
            unit: formData.get("unit"),
            description: formData.get("description"),
            purchaseDate: formData.get("purchaseDate"),
        };

        try {
            const res = await fetch("/api/assets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) throw new Error("Failed to create asset");

            onSuccess();
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("创建资产失败");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5 text-black">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">资产名称</label>
                    <input
                        name="name"
                        required
                        placeholder="例如: MacBook Pro M3"
                        className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">类型</label>
                    <select
                        name="type"
                        className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                    >
                        <option value="FIXED">固定资产 (Fixed Asset)</option>
                        <option value="CRYPTO">数字资产 (Crypto)</option>
                        <option value="CASH">现金/存款 (Cash)</option>
                        <option value="SUBSCRIPTION">预付/权益 (Subscription)</option>
                        <option value="OTHER">其他 (Other)</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">初始价值</label>
                    <input
                        name="initialValue"
                        type="number"
                        step="0.01"
                        required
                        className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">币种</label>
                    <select
                        name="currency"
                        className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                    >
                        <option value="CNY">CNY</option>
                        <option value="USD">USD</option>
                        <option value="HKD">HKD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="JPY">JPY</option>
                        <option value="USDT">USDT</option>
                        <option value="BTC">BTC</option>
                        <option value="ETH">ETH</option>
                        <option value="SOL">SOL</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">数量 (可选)</label>
                    <input
                        name="quantity"
                        type="number"
                        step="0.000001"
                        className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">单位 (可选)</label>
                    <input
                        name="unit"
                        placeholder="台/个/BTC"
                        className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5"
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">购入日期</label>
                <input
                    name="purchaseDate"
                    type="date"
                    required
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                />
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">备注描述</label>
                <textarea
                    name="description"
                    rows={3}
                    className="flex w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 resize-none"
                />
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-black py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
            >
                {isLoading ? "提交中..." : "创建资产"}
            </button>
        </form>
    );
}
