"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Receipt,
  TrendingUp,
  Wallet,
  PiggyBank,
  FileText
} from "lucide-react";

interface UserStats {
  totalReimbursements: number;
  pendingReimbursements: number;
  approvedReimbursements: number;
  totalAmount: number;
  pendingAmount: number;
  salaryUsdt?: number;
}

interface RecentReimbursement {
  id: string;
  title: string;
  amountOriginal: number;
  currency: string;
  amountUsdEquivalent: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

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

interface SalaryApiResponse {
  user: {
    salaryUsdt: number;
  };
  payments: SalaryPayment[];
}

const formatCurrency = (value: number, unit = "USD") =>
  `${value.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${unit}`;

const formatDateTime = (dateString: string) =>
  new Date(dateString).toLocaleString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

const formatSalaryMonth = (month: string) => {
  const [year, monthPart] = month.split("-");
  return `${year}年${monthPart}月`;
};

const reimbursementStatusBadge = (status: string) => {
  switch (status) {
    case "submitted":
      return { label: "待审核", className: "bg-amber-100 text-amber-700" };
    case "reviewing":
    case "under_review":
      return { label: "审核中", className: "bg-blue-100 text-blue-700" };
    case "approved":
      return { label: "已批准", className: "bg-emerald-100 text-emerald-700" };
    case "paid":
      return { label: "已支付", className: "bg-indigo-100 text-indigo-700" };
    case "rejected":
      return { label: "已拒绝", className: "bg-rose-100 text-rose-700" };
    default:
      return { label: status, className: "bg-slate-100 text-slate-700" };
  }
};

const salaryStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return { label: "待发放", className: "bg-amber-100 text-amber-700" };
    case "scheduled":
      return { label: "已计划", className: "bg-blue-100 text-blue-700" };
    case "paid":
      return { label: "已发放", className: "bg-emerald-100 text-emerald-700" };
    default:
      return { label: status, className: "bg-slate-100 text-slate-700" };
  }
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentReimbursements, setRecentReimbursements] = useState<RecentReimbursement[]>([]);
  const [salaryInfo, setSalaryInfo] = useState<{ amount: number; payments: SalaryPayment[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      void fetchUserData();
    }
  }, [status, router]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const [statsResponse, reimbursementsResponse, salaryResponse] = await Promise.all([
        fetch("/api/users/stats"),
        fetch("/api/reimbursements"),
        fetch("/api/salaries")
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json() as UserStats;
        setStats({
          ...statsData,
          salaryUsdt: statsData.salaryUsdt ?? 0
        });
      }

      if (reimbursementsResponse.ok) {
        const reimbursementsData = await reimbursementsResponse.json() as { reimbursements?: RecentReimbursement[] };
        setRecentReimbursements(reimbursementsData.reimbursements?.slice(0, 6) ?? []);
      }

      if (salaryResponse.ok) {
        const salaryData = await salaryResponse.json() as SalaryApiResponse;
        setSalaryInfo({
          amount: salaryData.user?.salaryUsdt ?? 0,
          payments: salaryData.payments?.slice(0, 6) ?? []
        });
      }
    } catch (error) {
      console.error("获取用户控制台数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const upcomingSalary = useMemo(
    () => salaryInfo?.payments.find((payment) => payment.status !== "paid"),
    [salaryInfo]
  );

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-slate-50 to-slate-100">
        <div className="text-center">
          <div className="mb-4 inline-flex h-16 w-16 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-500" />
          <p className="text-sm text-slate-500">加载控制台数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-slate-50 to-slate-100">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_120%_at_50%_0%,rgba(59,130,246,0.12),rgba(14,165,233,0.08),transparent)]" />
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-8 lg:px-12">
        <section className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-xl backdrop-blur">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(120%_140%_at_0%_0%,rgba(99,102,241,0.18),rgba(79,70,229,0.08),transparent)]" />
            <div className="flex flex-col gap-6">
              <div className="space-y-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-600">
                  欢迎回来
                </span>
                <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
                  你好，{session?.user?.name || "ReimX 成员"}
                </h1>
                <p className="text-sm text-slate-600 sm:text-base">
                  在这里查看你的报销进展、工资发放节奏以及下一步待处理事项。让财务协作保持透明高效。
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/60 bg-white/70 px-4 py-3 shadow-sm backdrop-blur">
                  <p className="text-xs uppercase tracking-wide text-slate-500">累计报销金额</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">
                    {formatCurrency(stats?.totalAmount ?? 0)}
                  </p>
                  <p className="text-xs text-slate-500">USD 等值</p>
                </div>
                <div className="rounded-2xl border border-white/60 bg-white/70 px-4 py-3 shadow-sm backdrop-blur">
                  <p className="text-xs uppercase tracking-wide text-slate-500">待审核报销</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">
                    {stats?.pendingReimbursements ?? 0} 笔
                  </p>
                  <p className="text-xs text-slate-500">
                    待支付金额 {formatCurrency(stats?.pendingAmount ?? 0)}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/60 bg-white/70 px-4 py-3 shadow-sm backdrop-blur">
                  <p className="text-xs uppercase tracking-wide text-slate-500">标准月薪</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">
                    {formatCurrency(salaryInfo?.amount ?? stats?.salaryUsdt ?? 0, "USDT")}
                  </p>
                  <p className="text-xs text-slate-500">结合工资中心查看发放状态</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-xl backdrop-blur">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(110%_150%_at_0%_0%,rgba(16,185,129,0.16),rgba(59,130,246,0.1),transparent)]" />
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">快捷操作</h2>
                <p className="text-sm text-slate-600">常用入口在这里一步直达。</p>
              </div>
              <div className="space-y-3">
                <DashboardLink
                  href="/reimbursements"
                  icon={Receipt}
                  title="提交报销申请"
                  description="填写费用明细并上传凭证"
                  accent="from-indigo-500/10 to-indigo-500/5 text-indigo-600"
                />
                <DashboardLink
                  href="/reimbursements/history"
                  icon={FileText}
                  title="查看报销历史"
                  description="掌握每笔报销的最新状态"
                  accent="from-slate-500/10 to-slate-500/5 text-slate-600"
                />
                <DashboardLink
                  href="/salary"
                  icon={Wallet}
                  title="工资发放记录"
                  description="了解每月发放进度及明细"
                  accent="from-emerald-500/10 to-emerald-500/5 text-emerald-600"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: "累计报销笔数",
              value: (stats?.totalReimbursements ?? 0).toLocaleString("zh-CN"),
              hint: "所有报销申请",
              icon: Receipt,
              accent: "from-indigo-500/15 to-indigo-500/5 text-indigo-600"
            },
            {
              title: "待审核报销",
              value: (stats?.pendingReimbursements ?? 0).toLocaleString("zh-CN"),
              hint: "等待审批中",
              icon: Clock,
              accent: "from-amber-500/15 to-amber-500/5 text-amber-600"
            },
            {
              title: "已批准报销",
              value: (stats?.approvedReimbursements ?? 0).toLocaleString("zh-CN"),
              hint: "通过并待支付",
              icon: CheckCircle2,
              accent: "from-emerald-500/15 to-emerald-500/5 text-emerald-600"
            },
            {
              title: "标准月薪",
              value: formatCurrency(salaryInfo?.amount ?? stats?.salaryUsdt ?? 0, "USDT"),
              hint: "由管理员设置",
              icon: PiggyBank,
              accent: "from-indigo-500/15 to-indigo-500/5 text-indigo-600"
            }
          ].map(({ title, value, hint, icon: Icon, accent }) => (
            <div
              key={title}
              className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className={`absolute right-4 top-4 h-12 w-12 rounded-xl bg-gradient-to-br ${accent}`} />
              <div className="relative space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
                  <Icon className="h-4 w-4 text-slate-400" />
                </div>
                <p className="text-2xl font-semibold text-slate-900">
                  {typeof value === "number" ? value : value}
                </p>
                <p className="text-xs text-slate-500">{hint}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.7fr,1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">最新报销动态</h3>
                <p className="text-sm text-slate-500">掌握每一次报销的流转和进度</p>
              </div>
              <Link
                href="/reimbursements/history"
                className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                查看全部
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            {recentReimbursements.length > 0 ? (
              <div className="mt-6 space-y-4">
                {recentReimbursements.map((reimbursement) => {
                  const badge = reimbursementStatusBadge(reimbursement.status);
                  return (
                    <div
                      key={reimbursement.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50/70 px-5 py-4 shadow-sm transition hover:border-slate-300 hover:bg-white"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-slate-900">{reimbursement.title}</h4>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span>{formatCurrency(reimbursement.amountUsdEquivalent)}</span>
                            <span className={`rounded-full px-2 py-1 text-xs font-medium ${badge.className}`}>
                              {badge.label}
                            </span>
                            <span>{formatDateTime(reimbursement.createdAt)}</span>
                          </div>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-slate-300" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                title="暂无报销记录"
                description="从一笔报销开始，记录团队的每一次协作。"
                actionLabel="立即提交报销"
                href="/reimbursements"
              />
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">工资发放节奏</h3>
                  <p className="text-sm text-slate-500">关注最近几期工资的发放状态</p>
                </div>
                <Link
                  href="/salary"
                  className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                  查看工资中心
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>

              {salaryInfo && salaryInfo.payments.length > 0 ? (
                <div className="mt-5 space-y-4">
                  {salaryInfo.payments.map((payment) => {
                    const badge = salaryStatusBadge(payment.status);
                    return (
                      <div
                        key={payment.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-700 shadow-sm transition hover:border-slate-300"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-slate-900">{formatSalaryMonth(payment.month)}</p>
                            <p className="text-xs text-slate-500">
                              金额 {formatCurrency(payment.amountUsdt, "USDT")}
                            </p>
                          </div>
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${badge.className}`}>
                            {badge.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-6">
                  <EmptyState
                    title="暂无工资记录"
                    description="等待管理员为你设置工资发放计划。"
                    actionLabel="了解薪资模块"
                    href="/salary"
                  />
                </div>
              )}

              {salaryInfo && (
                <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                  {upcomingSalary ? (
                    <p>
                      下一次发放：{formatSalaryMonth(upcomingSalary.month)} ·{" "}
                      {formatCurrency(upcomingSalary.amountUsdt, "USDT")}
                    </p>
                  ) : (
                    <p>发放计划正常，暂无未发放的记录。</p>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">系统状态</h3>
                <span className="inline-flex items-center gap-2 text-xs font-medium text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  正常运行
                </span>
              </div>
              <div className="mt-4 space-y-4 text-xs text-slate-500">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="font-medium text-slate-700">最近登录</p>
                  <p>{new Date().toLocaleString("zh-CN")}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="font-medium text-slate-700">财务操作提示</p>
                  <p>报销审批通过后，可在工资中心批量生成发放批次。</p>
                </div>
              </div>
            </div>
          </div>
      </section>
      </div>
    </div>
  );
}

function DashboardLink(props: {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  const { href, title, description, icon: Icon, accent } = props;
  return (
    <Link
      href={href}
      className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 shadow-sm transition hover:border-indigo-200 hover:bg-white"
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${accent}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-900">{title}</p>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <ArrowUpRight className="h-4 w-4 text-slate-400 transition group-hover:text-indigo-500" />
    </Link>
  );
}

function EmptyState(props: { title: string; description: string; actionLabel: string; href: string }) {
  const { title, description, actionLabel, href } = props;
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50/80 px-6 py-10 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
        <TrendingUp className="h-6 w-6 text-slate-400" />
      </div>
      <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
      <p className="mt-2 text-xs text-slate-500">{description}</p>
      <Link
        href={href}
        className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-indigo-600 transition hover:border-indigo-200 hover:text-indigo-700"
      >
        {actionLabel}
        <ArrowUpRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
