import Link from "next/link";
import { ArrowRight, BarChart3, CheckCircle2, ShieldCheck, Wallet } from "lucide-react";

const features = [
  {
    title: "多角色协作",
    description: "成员、审核员、管理员多角色协同，确保流程透明高效。",
    icon: ShieldCheck
  },
  {
    title: "多链支付",
    description: "支持 EVM 与 Solana，两条链路自由切换，满足 Web3 财务需求。",
    icon: Wallet
  },
  {
    title: "实时汇率",
    description: "自动对接 Binance/Coinbase，报销时即时锁定 USD 汇率。",
    icon: CheckCircle2
  },
  {
    title: "数据报表",
    description: "USD 总支出、币种占比、月度趋势一目了然。",
    icon: BarChart3
  }
];

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-5xl flex-col gap-16 px-6 py-16">
      <section className="space-y-6 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
          Web3 Reimbursement System
        </span>
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          构建以 Web3 为先的报销与费用管理体验
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-slate-600">
          ReimX 结合 Next.js 15、Prisma、Telegram Bot 与链上支付，为分布式团队提供开箱即用的费用管理流程：提交、审核、支付、通知全自动。
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
          >
            进入控制台
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="https://github.com"
            className="text-sm font-semibold text-slate-600 transition hover:text-primary"
          >
            查看部署指南
          </Link>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        {features.map((feature) => (
          <article key={feature.title} className="rounded-xl border border-slate-200 bg-white/80 p-6 shadow-sm">
            <feature.icon className="h-10 w-10 text-primary" />
            <h3 className="mt-4 text-xl font-semibold text-slate-900">{feature.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-8 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-8 md:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-slate-900">架构一览</h2>
          <p className="text-sm leading-6 text-slate-600">
            前端采用 Next.js App Router，后端以 Server Actions 与 Prisma 协调 Neon PostgreSQL；借助 Vercel Blob 存储报销附件，支付环节通过 ethers.js 与 @solana/web3.js 触达多链。
          </p>
        </div>
        <ul className="space-y-3 text-sm text-slate-600">
          <li>• Auth：NextAuth Email + JWT 双模</li>
          <li>• Notifications：Telegram Bot + Resend</li>
          <li>• Exchange：Binance 实时行情 + 管理员人工修正</li>
          <li>• Analytics：Chart.js 与 Recharts 提供多维度报表</li>
        </ul>
      </section>
    </main>
  );
}
