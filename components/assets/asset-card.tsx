import Link from "next/link";
// import { formatCurrency } from "@/lib/utils"; 
import { ArrowUpRight, ArrowDownRight, ArrowRight } from "lucide-react";

interface Asset {
    id: string;
    name: string;
    type: string;
    currency: string;
    initialValue: string | number;
    currentValue: string | number;
    status: string;
}

export function AssetCard({ asset }: { asset: Asset }) {
    const initial = Number(asset.initialValue);
    const current = Number(asset.currentValue);
    const diff = current - initial;
    const isPositive = diff >= 0;
    const percentage = initial > 0 ? (diff / initial) * 100 : 0;

    return (
        <Link
            href={`/dashboard/assets/${asset.id}`}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-gray-200"
        >
            <div className="flex justify-between items-start">
                <div>
                    <span className="inline-flex items-center rounded-full bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-600 mb-2 border border-gray-100">
                        {asset.type}
                    </span>
                    <h3 className="font-semibold text-lg text-gray-900 group-hover:text-black transition-colors">
                        {asset.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 capitalize">{asset.status.toLowerCase()}</p>
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    {Math.abs(percentage).toFixed(1)}%
                </div>
            </div>

            <div className="mt-6">
                <p className="text-sm text-gray-500 mb-1">当前净值</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900">
                        {asset.currency} {current.toLocaleString()}
                    </span>
                    {diff !== 0 && (
                        <span className={`text-xs ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                            ({diff > 0 ? '+' : ''}{diff.toLocaleString()})
                        </span>
                    )}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                    初始: {asset.currency} {initial.toLocaleString()}
                </p>
            </div>

            <div className="absolute bottom-4 right-4 opacity-0 transform translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200">
                <ArrowRight className="h-5 w-5 text-gray-400" />
            </div>
        </Link>
    );
}
