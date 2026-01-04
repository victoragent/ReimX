"use client";

import { cn } from "@/lib/utils";
import { Check, X, Trash2 } from "lucide-react";

// Types matching Prisma model (partial)
interface LedgerEntry {
    id: string;
    type: string;
    amountOriginal: number | string;
    amountUsdEquivalent: number | string;
    currency: string;
    title: string;
    description?: string | null;
    transactionDate: string | Date;
    status: string; // PENDING, APPROVED, REJECTED
    attachmentUrl?: string | null;
    txHash?: string | null;
    user: {
        username: string;
        email: string;
    };
}

interface LedgerTableProps {
    entries: LedgerEntry[];
    isAdmin?: boolean;
    onReview?: (id: string, action: "APPROVE" | "REJECT") => void;
    onDelete?: (id: string) => void;
}

export function LedgerTable({ entries, isAdmin = false, onReview, onDelete }: LedgerTableProps) {

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return (
                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-yellow-400"></span>
                        待审核
                    </span>
                );
            case "APPROVED":
                return (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-green-400"></span>
                        已批准
                    </span>
                );
            case "REJECTED":
                return (
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-red-400"></span>
                        已驳回
                    </span>
                );
            default:
                return <span className="text-xs text-gray-500">{status}</span>;
        }
    };

    const getTypeLabel = (type: string) => {
        const map: Record<string, string> = {
            technology: "技术/研发",
            marketing: "市场/运营",
            administrative: "行政/办公",
            hr: "人力/招聘",
            other: "其他"
        };
        return map[type] || type;
    };

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                    <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500">日期</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500">标题</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500">用户</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500">类型</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500">金额 (原始)</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500">金额 (USD)</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500">状态</th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-500">操作</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                    {entries.length === 0 ? (
                        <tr>
                            <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-500">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="rounded-full bg-gray-50 p-3">
                                        <div className="h-6 w-6 rounded-md border border-gray-200 bg-white"></div>
                                    </div>
                                    <p>暂无记录</p>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        entries.map((entry) => (
                            <tr key={entry.id} className="group transition-colors hover:bg-gray-50/50">
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 font-mono">
                                    {new Date(entry.transactionDate).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-black">{entry.title}</div>
                                    {entry.description && <div className="max-w-xs truncate text-xs text-gray-400 mt-0.5">{entry.description}</div>}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                                    <div className="font-medium text-black">{entry.user.username}</div>
                                    <div className="text-xs text-gray-400">{entry.user.email}</div>
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                                    <span className="inline-flex rounded-md border border-gray-100 bg-gray-50 px-2 py-0.5 text-xs text-gray-600">
                                        {getTypeLabel(entry.type)}
                                    </span>
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-black">
                                    {Number(entry.amountOriginal)} <span className="text-xs text-gray-400 ml-1">{entry.currency}</span>
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-black">
                                    ${Number(entry.amountUsdEquivalent).toFixed(2)}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4">
                                    {getStatusBadge(entry.status)}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                    <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                                        {isAdmin && entry.status === "PENDING" && onReview && (
                                            <>
                                                <button
                                                    onClick={() => onReview(entry.id, "APPROVE")}
                                                    className="rounded-md bg-black p-1.5 text-white shadow-sm hover:bg-gray-800"
                                                    title="批准"
                                                >
                                                    <Check className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => onReview(entry.id, "REJECT")}
                                                    className="rounded-md border border-gray-200 bg-white p-1.5 text-gray-500 hover:bg-gray-50 hover:text-black"
                                                    title="驳回"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            </>
                                        )}
                                        {!isAdmin && entry.status === "PENDING" && onDelete && (
                                            <button
                                                onClick={() => onDelete(entry.id)}
                                                className="rounded-md border border-gray-200 p-1.5 text-gray-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                                title="删除"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                        {isAdmin && onDelete && (
                                            <button
                                                onClick={() => onDelete(entry.id)}
                                                className="rounded-md border border-gray-200 p-1.5 text-gray-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                                title="删除"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
