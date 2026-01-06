"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, Edit2, History } from "lucide-react";
import Link from "next/link";
import { RecordModal } from "@/components/assets/record-modal";
import { AssetChart } from "@/components/assets/asset-chart";

export default function AssetDetailPage({ params }: { params: { id: string } }) {
    const [asset, setAsset] = useState<any>(null);
    const [records, setRecords] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showRecordModal, setShowRecordModal] = useState(false);
    const router = useRouter();

    const fetchAsset = async () => {
        try {
            const res = await fetch(`/api/assets/${params.id}`);
            if (res.ok) {
                const data = await res.json();
                setAsset(data);
            } else {
                if (res.status === 404) router.push("/dashboard/assets");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchRecords = async () => {
        try {
            const res = await fetch(`/api/assets/${params.id}/records`);
            if (res.ok) {
                const data = await res.json();
                setRecords(data as any[]);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const loadData = async () => {
        setIsLoading(true);
        await Promise.all([fetchAsset(), fetchRecords()]);
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [params.id]);

    const handleDelete = async () => {
        if (!confirm("确定要删除该资产吗？这将删除所有关联记录且不可恢复。")) return;
        try {
            const res = await fetch(`/api/assets/${params.id}`, { method: "DELETE" });
            if (res.ok) {
                router.push("/dashboard/assets");
            } else {
                alert("删除失败");
            }
        } catch (e) {
            alert("Delete failed");
        }
    };

    if (isLoading || !asset) return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-black"></div>
        </div>
    );

    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-8 lg:px-12 bg-white min-h-screen text-black">
            {/* Header */}
            <div className="flex items-center justify-between pb-5">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/assets" className="rounded-full p-2 hover:bg-gray-100 transition-colors">
                        <ArrowLeft className="h-5 w-5 text-gray-500" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-bold tracking-tight text-black">{asset.name}</h1>
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 border border-gray-200">
                                {asset.type}
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">{asset.description || "无描述"}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleDelete}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
                    >
                        <Trash2 className="h-4 w-4" />
                        删除
                    </button>
                    <button
                        onClick={() => setShowRecordModal(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                    >
                        <Edit2 className="h-4 w-4" />
                        记录变动
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-6">
                    <p className="text-sm font-medium text-gray-500">当前净值</p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900">
                            {Number(asset.currentValue).toLocaleString()} <span className="text-lg text-gray-500">{asset.currency}</span>
                        </span>
                    </div>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-6">
                    <p className="text-sm font-medium text-gray-500">初始价值</p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900">
                            {Number(asset.initialValue).toLocaleString()} <span className="text-lg text-gray-500">{asset.currency}</span>
                        </span>
                    </div>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-6">
                    <p className="text-sm font-medium text-gray-500">总收益/消耗</p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className={`text-3xl font-bold ${Number(asset.currentValue) >= Number(asset.initialValue) ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {(Number(asset.currentValue) - Number(asset.initialValue)).toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-500">
                            ({((Number(asset.currentValue) - Number(asset.initialValue)) / Number(asset.initialValue) * 100).toFixed(1)}%)
                        </span>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="mb-6 font-semibold text-gray-900">价值趋势</h3>
                <AssetChart records={records} />
            </div>

            {/* History Table */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <History className="h-4 w-4" />
                        历史记录
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 font-medium text-gray-500">日期</th>
                                <th className="px-6 py-3 font-medium text-gray-500">类型</th>
                                <th className="px-6 py-3 font-medium text-gray-500 text-right">变动额</th>
                                <th className="px-6 py-3 font-medium text-gray-500 text-right">变动后价值</th>
                                <th className="px-6 py-3 font-medium text-gray-500">备注</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {records.map((record) => (
                                <tr key={record.id} className="group hover:bg-gray-50/50">
                                    <td className="px-6 py-4 text-gray-900">{new Date(record.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${record.type === 'CONSUMPTION' ? 'bg-rose-50 text-rose-700 ring-rose-600/20' :
                                            record.type === 'ADDITION' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' :
                                                record.type === 'REVALUATION' ? 'bg-indigo-50 text-indigo-700 ring-indigo-600/20' :
                                                    'bg-gray-50 text-gray-600 ring-gray-500/10'
                                            }`}>
                                            {record.type}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-4 text-right font-medium ${Number(record.amountChange) > 0 ? 'text-emerald-600' : Number(record.amountChange) < 0 ? 'text-rose-600' : 'text-gray-900'}`}>
                                        {Number(record.amountChange) > 0 ? '+' : ''}{Number(record.amountChange).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-right text-gray-900 font-medium">
                                        {Number(record.valueAfter).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">{record.note || "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Record Modal */}
            {showRecordModal && (
                <RecordModal
                    assetId={params.id}
                    onClose={() => setShowRecordModal(false)}
                    onSuccess={() => {
                        setShowRecordModal(false);
                        loadData();
                    }}
                />
            )}
        </div>
    );
}
