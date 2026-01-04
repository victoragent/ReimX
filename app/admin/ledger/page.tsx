"use client";

import { useEffect, useState } from "react";
import { LedgerTable } from "@/components/ledger/ledger-table";
import { LedgerForm } from "@/components/ledger/ledger-form";
import { Plus, X } from "lucide-react";

export default function AdminLedgerPage() {
    const [entries, setEntries] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [statusFilter, setStatusFilter] = useState("");

    const fetchEntries = async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams();
            if (statusFilter) params.append("status", statusFilter);

            const res = await fetch(`/api/ledger?${params.toString()}`);
            if (res.ok) {
                const data = await res.json() as { entries: any[] };
                setEntries(data.entries || []);
            }
        } catch (error) {
            console.error("Failed to fetch entries", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEntries();
    }, [statusFilter]);

    const handleReview = async (id: string, action: "APPROVE" | "REJECT") => {
        try {
            const res = await fetch(`/api/admin/ledger/${id}/review`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action })
            });

            if (res.ok) {
                fetchEntries();
            } else {
                alert("操作失败");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("确定要删除这条记录吗？此操作无法撤销。")) return;

        try {
            const res = await fetch(`/api/ledger/${id}`, {
                method: "DELETE"
            });

            if (res.ok) {
                fetchEntries();
            } else {
                const data = await res.json() as { error?: string };
                alert(data.error || "删除失败");
            }
        } catch (e) {
            console.error(e);
            alert("删除失败，请重试");
        }
    };

    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-8 lg:px-12 bg-white min-h-screen text-black">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-black">全局财务账本</h1>
                    <p className="mt-2 text-sm text-gray-500">管理所有用户的记账与资产记录</p>
                </div>

                <div className="flex gap-4">
                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="h-9 w-32 appearance-none rounded-lg border border-gray-200 bg-white px-3 text-sm text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                        >
                            <option value="">所有状态</option>
                            <option value="PENDING">待审核</option>
                            <option value="APPROVED">已批准</option>
                            <option value="REJECTED">已驳回</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd" />
                            </svg>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowModal(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                    >
                        <Plus className="h-4 w-4" />
                        新增记录
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="space-y-4">
                <LedgerTable
                    entries={entries}
                    isAdmin={true}
                    onReview={handleReview}
                    onDelete={handleDelete}
                />
            </div>

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
                            <h2 className="text-xl font-bold tracking-tight text-black">管理员记账</h2>
                            <p className="mt-1 text-sm text-gray-500">管理员创建的记录将自动标记为无需审核 (Approved)</p>
                        </div>
                        <LedgerForm onSuccess={() => {
                            setShowModal(false);
                            fetchEntries();
                        }} />
                    </div>
                </div>
            )}
        </div>
    );
}
