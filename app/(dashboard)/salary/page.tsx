"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface SalaryPayment {
  id: string;
  month: string;
  amountUsdt: number;
  status: string;
  scheduledAt?: string | null;
  paidAt?: string | null;
  transactionHash?: string | null;
  notes?: string | null;
}

interface SalaryResponse {
  user: {
    id: string;
    username: string;
    salaryUsdt: number;
  };
  payments: SalaryPayment[];
}

const formatStatus = (status: string) => {
  switch (status) {
    case "pending":
      return { label: "待发放", color: "bg-yellow-100 text-yellow-800" };
    case "scheduled":
      return { label: "已计划", color: "bg-blue-100 text-blue-800" };
    case "paid":
      return { label: "已发放", color: "bg-green-100 text-green-800" };
    default:
      return { label: status, color: "bg-gray-100 text-gray-800" };
  }
};

const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

export default function SalaryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [payments, setPayments] = useState<SalaryPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState<string>(currentMonth());
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [userInfo, setUserInfo] = useState<{ username: string; salaryUsdt: number } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetchPayments().catch((err) => console.error(err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, month, statusFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (month) {
        params.set("month", month);
      }
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }

      const response = await fetch(`/api/salaries?${params.toString()}`);
      const result = await response.json() as SalaryResponse & { error?: string };

      if (!response.ok) {
        setError(result.error || "获取工资记录失败");
        setPayments([]);
        setUserInfo(null);
        return;
      }

      setPayments(result.payments);
      setUserInfo({
        username: result.user.username,
        salaryUsdt: result.user.salaryUsdt
      });
    } catch (err) {
      console.error(err);
      setError("网络错误，请稍后再试");
      setPayments([]);
      setUserInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    const totalPaid = payments
      .filter((payment) => payment.status === "paid")
      .reduce((sum, payment) => sum + payment.amountUsdt, 0);

    const upcoming = payments
      .filter((payment) => payment.status !== "paid")
      .reduce((sum, payment) => sum + payment.amountUsdt, 0);

    return {
      totalPaid,
      upcoming
    };
  }, [payments]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">加载工资信息...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">我的工资</h1>
        <p className="mt-1 text-gray-600">查看每月 USDT 计价的工资发放记录。</p>
        {userInfo && (
          <div className="mt-4 flex flex-wrap items-center gap-6 text-sm">
            <div>
              <span className="text-gray-500">标准月薪：</span>
              <span className="font-semibold text-indigo-600">{userInfo.salaryUsdt.toFixed(2)} USDT</span>
            </div>
            <div>
              <span className="text-gray-500">已发放合计：</span>
              <span className="font-semibold text-green-600">{summary.totalPaid.toFixed(2)} USDT</span>
            </div>
            <div>
              <span className="text-gray-500">待发放合计：</span>
              <span className="font-semibold text-yellow-600">{summary.upcoming.toFixed(2)} USDT</span>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">月份</label>
            <input
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">状态</label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">全部</option>
              <option value="pending">待发放</option>
              <option value="scheduled">已计划</option>
              <option value="paid">已发放</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {payments.length === 0 ? (
          <div className="border border-dashed border-gray-300 rounded-lg p-10 text-center text-gray-500">
            暂无工资记录，或尚未生成对应月份的工资发放。
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => {
              const statusInfo = formatStatus(payment.status);
              return (
                <div
                  key={payment.id}
                  className="border border-gray-200 rounded-lg p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div>
                    <div className="text-sm text-gray-500">月份</div>
                    <div className="text-lg font-semibold text-gray-900">{payment.month}</div>
                    {payment.notes && (
                      <div className="mt-1 text-sm text-gray-500">备注：{payment.notes}</div>
                    )}
                  </div>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">金额</div>
                      <div className="text-base font-semibold text-indigo-600">
                        {payment.amountUsdt.toFixed(2)} USDT
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">状态</div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">发放时间</div>
                      <div className="text-base text-gray-700">
                        {payment.paidAt ? new Date(payment.paidAt).toLocaleString() : "待发放"}
                      </div>
                    </div>
                  </div>
                  {payment.transactionHash && (
                    <div className="text-xs text-gray-500">
                      交易哈希：<span className="font-mono break-all">{payment.transactionHash}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
