import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Calculator,
  CreditCard,
  FileText,
  FolderGit2,
  Receipt,
  ShieldCheck,
  Sparkles,
  Wallet
} from "lucide-react";

const featureCards = [
  {
    title: "报销自动化",
    description: "多币种、跨网络的报销流程，内置智能审批矩阵与 Safe Wallet 支付链路。",
    icon: Receipt,
    href: "/admin/reimbursements",
    cta: "查看报销工作台"
  },
  {
    title: "工资中心",
    description: "管理员定义 USDT 薪资，按月生成工资单并通过 Safe Wallet 批量发放。",
    icon: Wallet,
    href: "/admin/salaries",
    cta: "管理工资发放"
  },
  {
    title: "收入与财务总览",
    description: "聚合链上与离线收入，智能分类并实时更新总账与资金流。",
    icon: BarChart3,
    href: "/dashboard",
    cta: "进入财务总览"
  },
  {
    title: "支出管控",
    description: "支出预算、白名单与多层级审批，确保每笔支出可追踪、可稽核。",
    icon: CreditCard,
    href: "/admin",
    cta: "配置支出策略"
  },
  {
    title: "税务合规",
    description: "生成税务报表、保留审计链路，满足 Web3 企业多地域合规要求。",
    icon: Calculator,
    href: "/admin/analytics",
    cta: "查看税务视图"
  },
  {
    title: "全链路合规",
    description: "角色权限、操作日志与风险告警，确保团队协作安全透明。",
    icon: ShieldCheck,
    href: "/admin/users",
    cta: "管理团队权限"
  }
];

const operatingLayers = [
  {
    title: "资金层",
    description: "支持 USDT / USD / 法币并行记账，实时同步 Safe Wallet 交易与银行流水。",
    bullets: ["多币种统一估值", "资金归集与拆分", "流动性监控"]
  },
  {
    title: "业务层",
    description: "连接报销、工资、收入、支出、税务的全流程业务引擎。",
    bullets: ["智能审批流", "自动归档凭证", "跨团队协作白板"]
  },
  {
    title: "合规层",
    description: "审计数据仓库、税务模板与 KYC/KYB 集成，沉淀合规资产。",
    bullets: ["多地域税务模板", "审计追踪 ID", "风险与预警中心"]
  }
];

const numbers = [
  { label: "多链 + 法币支持", value: "8", hint: "USDT / USD / RMB / EUR 等" },
  { label: "审批节点", value: "12+", hint: "自定义审批矩阵" },
  { label: "Safe Wallet 集成", value: "秒级", hint: "批量签名与回写" },
  { label: "合规资产", value: "全量", hint: "税务 & 审计文档归档" }
];

export default function LandingPage() {
  const transactionsPreview = [
    { title: "多币种报销", body: "费用合规审查 → 汇率锁定 → Safe Wallet 付款 → 自动对账" },
    { title: "工资发放", body: "月度工资单生成 → 批次筛选 → Safe Wallet 批付 → 员工确认" },
    { title: "收支管理", body: "链上收入抓取 → 分类记账 → 税务预提 → 仪表盘更新" }
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-slate-50 to-slate-100 text-slate-900">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_120%_at_50%_0%,rgba(59,130,246,0.12),rgba(14,165,233,0.08),transparent)]" />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-16 px-6 pb-24 pt-28 sm:px-10 lg:px-12">
        <section className="relative flex flex-col gap-10 text-center">
          <div className="mx-auto max-w-3xl space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium uppercase tracking-[0.3em] text-slate-600">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              Web3 财务操作系统
            </span>
            <h1 className="text-4xl font-semibold leading-tight sm:text-6xl">
              让
              <span className="mx-2 bg-gradient-to-r from-indigo-300 via-sky-200 to-teal-200 bg-clip-text text-transparent">
                企业财务
              </span>
              在 Web3 世界依然透明、高效、合规
            </h1>
            <p className="text-lg leading-relaxed text-slate-600 sm:text-xl">
              ReimX 将报销、工资、收入、支出与税务管理统一到一个安全的财务操作系统中。像构建工程一样构建财务流程，
              让每一笔资金、每一份凭证都可以被追踪与审计。
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-black"
            >
              新用户注册
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              已有账号登录
            </Link>
          </div>

          <div className="mx-auto grid w-full max-w-5xl gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-3">
            {transactionsPreview.map((item) => (
              <div key={item.title} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
                <div className="text-sm font-medium text-indigo-600">{item.title}</div>
                <div className="text-sm leading-relaxed text-slate-600">{item.body}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-8 border border-slate-200 bg-white p-8 shadow-sm sm:grid-cols-2 lg:grid-cols-3">
          {featureCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 transition duration-300 hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-slate-100 p-2 text-slate-700 transition group-hover:bg-slate-200">
                  <card.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{card.title}</h3>
              </div>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-600">{card.description}</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-slate-700 group-hover:text-slate-900">
                {card.cta}
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </section>

        <section className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-500">Operations Blueprint</span>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">三层架构驱动 Web3 财务增长</h2>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              查看实时面板
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {operatingLayers.map((layer) => (
              <div key={layer.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <div className="text-sm font-semibold text-indigo-600">{layer.title}</div>
                <p className="mt-3 text-sm text-slate-600">{layer.description}</p>
                <ul className="mt-4 space-y-2">
                  {layer.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="flex h-1.5 w-1.5 rounded-full bg-slate-500" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-900 shadow-sm">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-black/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.3em] text-black/80">
                <FolderGit2 className="h-3.5 w-3.5" />
                metrics
              </span>
              <h2 className="text-3xl font-semibold text-black sm:text-4xl">工程化视角衡量 Web3 财务</h2>
              <p className="text-sm leading-relaxed text-black/70">
                ReimX 参考 Next.js 的工程能力，将财务流程组件化，帮助财务团队像部署代码一样部署财务策略。
                每个指标都可以追溯到链上或离线数据源，为决策提供确定性。
              </p>
            </div>
            <div className="grid flex-1 gap-4 sm:grid-cols-2">
              {numbers.map((metric) => (
                <div key={metric.label} className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
                  <div className="text-2xl font-semibold text-black">{metric.value}</div>
                  <div className="mt-1 text-sm font-medium text-black/70">{metric.label}</div>
                  <div className="mt-2 text-xs text-black/50">{metric.hint}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-500">Unified Ledger</span>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">在一个总账里看清所有资金流</h2>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              打开企业总账
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
                <FileText className="h-4 w-4" />
                多维度报表
              </div>
              <p className="text-sm text-slate-600">
                收入、支出、利润、税务预提自动更新，支持导出 CSV / PDF 一键递交审计。
              </p>
            </div>
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
                <Calculator className="h-4 w-4" />
                税务预提引擎
              </div>
              <p className="text-sm text-slate-600">
                针对不同司法辖区配置税率与抵扣规则，实时给出应交税额与风险提示。
              </p>
            </div>
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
                <ShieldCheck className="h-4 w-4" />
                审计可追踪
              </div>
              <p className="text-sm text-slate-600">
                每一次审批、签名与付款都保留链上与链下凭证，实现端到端的可追踪性。
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white p-10 text-center shadow-sm">
          <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">现在，让 ReimX 重塑你的财务基建</h2>
          <p className="mt-4 text-base text-slate-600">
            无论你是区块链创业公司还是去中心化团队，我们都能帮助你将财务流程工程化、规模化。
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-black"
            >
              创建企业账户
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              已有账号？立即登录
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
