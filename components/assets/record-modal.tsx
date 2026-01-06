"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RecordModal({
    assetId,
    onClose,
    onSuccess
}: {
    assetId: string;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const [recordType, setRecordType] = useState("CONSUMPTION");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const amountVal = Number(formData.get("amount"));

        // Logic to handle sign for Consumption if user enters positive number
        // Convention: API expects signed DELTA for CONSUMPTION.
        // Frontend UI: "Consumption Amount: 100". User thinks 100.
        // We should send -100.
        let finalAmount = amountVal;
        if (recordType === "CONSUMPTION") {
            finalAmount = -Math.abs(amountVal);
        } else if (recordType === "ADDITION") {
            finalAmount = Math.abs(amountVal);
        }
        // REVALUATION: Send as is (Target Value).

        const data = {
            type: recordType,
            amount: finalAmount,
            date: formData.get("date"),
            note: formData.get("note"),
        };

        try {
            const res = await fetch(`/api/assets/${assetId}/records`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) throw new Error("Failed to create record");

            onSuccess();
        } catch (error) {
            console.error(error);
            alert("提交失败");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px] p-4 transition-all">
            <div className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 shadow-xl animate-in fade-in zoom-in-95 duration-200 text-black">
                <button
                    onClick={onClose}
                    className="absolute right-5 top-5 inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-black"
                >
                    ✕
                </button>

                <div className="mb-6">
                    <h2 className="text-xl font-bold">记录变动</h2>
                    <p className="text-sm text-gray-500">记录资产的使用消耗或净值更新</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-3 gap-2 p-1 bg-gray-50 rounded-lg">
                        <button type="button" onClick={() => setRecordType("CONSUMPTION")} className={`py-2 text-sm font-medium rounded-md transition-all ${recordType === "CONSUMPTION" ? "bg-white shadow text-rose-600" : "text-gray-500 hover:text-gray-900"}`}>
                            记录消耗
                        </button>
                        <button type="button" onClick={() => setRecordType("REVALUATION")} className={`py-2 text-sm font-medium rounded-md transition-all ${recordType === "REVALUATION" ? "bg-white shadow text-indigo-600" : "text-gray-500 hover:text-gray-900"}`}>
                            更新净值
                        </button>
                        <button type="button" onClick={() => setRecordType("ADDITION")} className={`py-2 text-sm font-medium rounded-md transition-all ${recordType === "ADDITION" ? "bg-white shadow text-emerald-600" : "text-gray-500 hover:text-gray-900"}`}>
                            追加投入
                        </button>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">
                            {recordType === "CONSUMPTION" ? "消耗金额 (减少)" :
                                recordType === "ADDITION" ? "投入金额 (增加)" :
                                    "最新总净值"}
                        </label>
                        <div className="relative">
                            <input
                                name="amount"
                                type="number"
                                step="0.01"
                                required
                                className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 pl-8"
                            />
                            <span className="absolute left-3 top-2.5 text-gray-400 text-xs">$</span>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">发生日期</label>
                        <input
                            name="date"
                            type="date"
                            required
                            defaultValue={new Date().toISOString().split('T')[0]}
                            className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">备注</label>
                        <textarea
                            name="note"
                            rows={2}
                            className="flex w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 resize-none"
                            placeholder={recordType === "CONSUMPTION" ? "例如: 2024 Q1 折旧" : "例如: 市场价格更新"}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full rounded-lg py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50 ${recordType === "CONSUMPTION" ? "bg-rose-600 hover:bg-rose-700" :
                                recordType === "ADDITION" ? "bg-emerald-600 hover:bg-emerald-700" :
                                    "bg-indigo-600 hover:bg-indigo-700"
                            }`}
                    >
                        {isLoading ? "提交中..." : "保存记录"}
                    </button>
                </form>
            </div>
        </div>
    );
}
