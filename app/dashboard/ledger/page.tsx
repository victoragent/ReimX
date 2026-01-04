"use client";

import { useEffect, useState } from "react";
import { LedgerTable } from "@/components/ledger/ledger-table";
import { LedgerForm } from "@/components/ledger/ledger-form";
import { Plus, X } from "lucide-react";

export default function UserLedgerPage() {
    const [entries, setEntries] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const fetchEntries = async () => {
        try {
            setIsLoading(true);
            const res = await fetch("/api/ledger");
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
    }, []);

    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-8 lg:px-12 bg-white min-h-screen text-black">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-5">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-black">我的记账本</h1>
                    <p className="mt-2 text-sm text-gray-500">记录您的额外收支与资产变动</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                >
                    <Plus className="h-4 w-4" />
                    记一笔
                </button>
            </div>

            {/* List */}
            <div className="space-y-4">
                <LedgerTable entries={entries} />
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
                            <h2 className="text-xl font-bold tracking-tight text-black">新增记账</h2>
                            <p className="mt-1 text-sm text-gray-500">提交后需等待管理员审核</p>
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
