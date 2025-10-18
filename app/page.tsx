import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CircuitBoard,
  Globe,
  Layers,
  LineChart,
  Lock,
  Sparkles,
  Users,
  Wallet,
  Workflow
} from "lucide-react";

const metrics = [
  { value: "3+", label: "支持币种" },
  { value: "EVM · Solana", label: "链上网络" },
  { value: "< 5s", label: "链上确认" },
  { value: "100%", label: "全程审计追踪" }
];

const primaryFeatures = [
  {
    title: "多币种报销引擎",
    description: "原生支持 EVM 与 Solana，自动处理链上地址、Gas 与到账校验。",
    icon: Wallet,
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600"
  },
  {
    title: "实时汇率与风控",
    description: "锁定实时汇率，自动生成 USD 等值，内置风控阈值与异常预警。",
    icon: LineChart,
    iconBg: "bg-sky-100",
    iconColor: "text-sky-600"
  },
  {
    title: "智能审批矩阵",
    description: "角色驱动的审批流程，灵活配置审批节点与预算控制策略。",
    icon: Layers,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600"
  },
  {
    title: "合规审计中心",
    description: "链上链下操作全量记录，满足企业级合规与安全审计要求。",
    icon: Lock,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600"
  }
];

const platformPillars = [
  {
    title: "员工提交端",
    description: "极简录入体验，支持票据上传、链路选择与自动换算。",
    bullets: [
      "多币种费用一键选择",
      "票据云端存储与校验",
      "移动端友好"
    ],
    icon: Users
  },
  {
    title: "财务运营台",
    description: "集中处理审批、发起批量支付与对账，实时掌握预算状态。",
    bullets: [
      "多维度统计面板",
      "链上交易状态回显",
      "一键导出审计报表"
    ],
    icon: LineChart
  },
  {
    title: "管理员中心",
    description: "统一配置权限矩阵、多币种策略与风控规则，保障团队协作安全。",
    bullets: [
      "细粒度角色管理",
      "自定义审批路径",
      "操作日志与警报"
    ],
    icon: CircuitBoard
  }
];

const workflow = [
  {
    step: "01",
    title: "发起报销",
    description: "员工提交费用明细，系统自动识别币种与链上需求。"
  },
  {
    step: "02",
    title: "智能审核",
    description: "根据角色矩阵自动流转，多维风控保障合规。"
  },
  {
    step: "03",
    title: "链上结算",
    description: "财务批量签名或调用托管钱包，秒级完成支付并回写状态。"
  }
];

const integrations = [
  { name: "EVM 生态", detail: "Ethereum · Polygon · BNB Chain", icon: Sparkles },
  { name: "Solana", detail: "高吞吐链上结算与地址管理", icon: Workflow },
  { name: "Fiat & Stablecoins", detail: "USD · USDC · CNY，自动汇率换算", icon: BadgeCheck },
  { name: "安全与合规", detail: "SOC2 启发式流程 · 全链路审计", icon: Lock }
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.12),_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-1/3 -z-10 h-[480px] bg-[radial-gradient(120%_120%_at_50%_0%,_rgba(56,189,248,0.18),_rgba(199,210,254,0.1),_transparent)]" />

      <main className="relative">
        <section className="relative px-6 pb-24 pt-20 sm:pb-32 sm:pt-28">
          <div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-[1.15fr_1fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/70 px-4 py-2 text-sm font-medium text-indigo-600 shadow-sm">
                <Sparkles className="h-4 w-4" />
                Web3 企业级报销系统
              </div>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-900 sm:text-6xl">
                让多币种报销
                <span className="bg-gradient-to-r from-indigo-600 via-sky-500 to-emerald-500 bg-clip-text text-transparent">
                  {" "}像执行脚本一样顺滑
                </span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-slate-600">
                ReimX 将多币种支付、实时汇率与智能审批整合为一体，为 Web3 团队带来像工程化流水线一样的财务体验。
                告别手工核对与跨团队沟通成本，让每一次报销都透明、高效、可追溯。
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-100 transition hover:bg-slate-700"
                >
                  立即体验
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                  已有账户？登录
                </Link>
              </div>
              <div className="mt-12 grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500">链上网络</p>
                      <p className="text-base font-semibold text-slate-900">EVM · Solana</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-slate-600">
                    针对不同链路自动切换模板与风控策略，保持支付体验一致。
                  </p>
                </div>
                <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
                      <Workflow className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500">审批自动化</p>
                      <p className="text-base font-semibold text-slate-900">矩阵驱动流程</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-slate-600">
                    角色驱动的审批引擎确保每一步都符合您的权限模型与预算限制。
                  </p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -left-6 -top-6 h-28 w-28 rounded-full bg-indigo-100/40 blur-2xl" />
              <div className="absolute -bottom-8 -right-6 h-32 w-32 rounded-full bg-emerald-100/50 blur-2xl" />
              <div className="relative rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-xl shadow-indigo-100/60 backdrop-blur">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">实时监控</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">报销总览</p>
                  </div>
                  <div className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-600">
                    Live
                  </div>
                </div>
                <div className="mt-6 space-y-4">
                  {metrics.map((metric) => (
                    <div key={metric.label} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white/60 px-4 py-3">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{metric.label}</p>
                        <p className="text-base font-semibold text-slate-900">{metric.value}</p>
                      </div>
                      <BadgeCheck className="h-4 w-4 text-slate-300" />
                    </div>
                  ))}
                </div>
                <div className="mt-8 rounded-2xl border border-slate-100 bg-slate-900 px-6 py-5 text-white">
                  <p className="text-sm font-medium text-slate-300">今日亮点</p>
                  <p className="mt-2 text-base font-semibold">
                    已自动匹配 <span className="text-emerald-300">12 笔</span> 多币种汇率，节省对账时间 63%。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative border-y border-white/70 bg-white/80 py-20 backdrop-blur">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-500">Capability</p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-900 sm:text-4xl">Web3 财务的核心引擎</h2>
              <p className="mt-4 text-base text-slate-600">
                以多币种支付、审批与审计为核心模块，构建面向未来的财务基础设施。
              </p>
            </div>
            <div className="mt-16 grid gap-8 md:grid-cols-2">
              {primaryFeatures.map((feature) => (
                <div
                  key={feature.title}
                  className="group relative overflow-hidden rounded-3xl border border-white/80 bg-white/70 p-8 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${feature.iconBg}`}>
                    <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-slate-900">{feature.title}</h3>
                  <p className="mt-4 text-base text-slate-600">{feature.description}</p>
                  <div className="mt-6 flex items-center text-sm font-medium text-indigo-600">
                    了解如何部署
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
                    <div className="absolute inset-x-8 top-0 h-1 rounded-full bg-gradient-to-r from-indigo-400/70 via-sky-300/70 to-emerald-300/70" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative bg-slate-50/60 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-10 lg:grid-cols-[0.7fr_1fr]">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Platform</p>
                <h2 className="mt-4 text-3xl font-semibold text-slate-900 sm:text-4xl">
                  面向不同角色的协同平台
                </h2>
                <p className="mt-4 text-base text-slate-600">
                  ReimX 已经实现员工、财务与管理员的分层体验，确保每个角色拥有精准的工具与权限。
                </p>
                <div className="mt-8 flex items-center gap-3 rounded-full border border-indigo-100 bg-white px-5 py-3 text-sm font-medium text-indigo-600 shadow-sm">
                  <Users className="h-4 w-4" />
                  多角色工作台实时同步
                </div>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                {platformPillars.map((pillar) => (
                  <div
                    key={pillar.title}
                    className="rounded-3xl border border-white/80 bg-white/80 p-6 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900/90 text-white">
                      <pillar.icon className="h-4 w-4" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-slate-900">{pillar.title}</h3>
                    <p className="mt-3 text-sm text-slate-600">{pillar.description}</p>
                    <ul className="mt-4 space-y-2 text-sm text-slate-500">
                      {pillar.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-center gap-2">
                          <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-400" />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative border-t border-white/70 bg-white/80 py-20 backdrop-blur">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-12 lg:grid-cols-[0.65fr_1fr]">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-500">Workflow</p>
                <h2 className="mt-4 text-3xl font-semibold text-slate-900 sm:text-4xl">
                  已落地的标准化报销流程
                </h2>
                <p className="mt-4 text-base text-slate-600">
                  从提交到链上结算，ReimX 提供全程可视化的节点追踪与通知体系，帮助团队快速响应。
                </p>
              </div>
              <div className="grid gap-6 sm:grid-cols-3">
                {workflow.map((item) => (
                  <div
                    key={item.step}
                    className="flex flex-col rounded-3xl border border-white/80 bg-white/70 p-6 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/10 text-sm font-semibold text-indigo-600">
                      {item.step}
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-slate-900">{item.title}</h3>
                    <p className="mt-3 text-sm text-slate-600">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative bg-slate-900 py-20 text-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.35),_transparent_60%)] opacity-60" />
          <div className="relative mx-auto max-w-6xl px-6">
            <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-200">Integration</p>
                <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">
                  与您的链上生态无缝对接
                </h2>
                <p className="mt-4 text-base text-slate-200">
                  基于现有实现的多币种与链上财务模块，ReimX 可以快速连接团队正在使用的钱包与稳定币体系。
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {integrations.map((item) => (
                  <div
                    key={item.name}
                    className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur transition hover:border-indigo-200/40 hover:bg-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                        <item.icon className="h-5 w-5 text-indigo-200" />
                      </div>
                      <p className="text-base font-semibold text-white">{item.name}</p>
                    </div>
                    <p className="mt-3 text-sm text-slate-300">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative bg-white/90 py-24 backdrop-blur">
          <div className="mx-auto max-w-5xl px-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <h2 className="mt-6 text-3xl font-semibold text-slate-900 sm:text-4xl">
              把多币种报销交给 ReimX，让团队专注于构建未来
            </h2>
            <p className="mt-4 text-base text-slate-600">
              凭借已实现的权限体系、多币种流程与审计模块，我们帮助 Web3 团队在扩张阶段稳住财务治理。
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-500"
              >
                立即注册
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
              >
                查看演示账号
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
