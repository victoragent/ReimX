import Link from "next/link";
import { ArrowRight, BarChart3, CheckCircle2, ShieldCheck, Wallet, Users, Zap, Globe, Lock } from "lucide-react";

const features = [
  {
    title: "智能角色管理",
    description: "多层级权限控制，确保财务流程安全透明",
    icon: Users,
    color: "text-blue-600"
  },
  {
    title: "多链支付支持",
    description: "EVM 与 Solana 双链支持，满足 Web3 企业需求",
    icon: Globe,
    color: "text-green-600"
  },
  {
    title: "实时汇率锁定",
    description: "自动汇率转换，确保财务数据准确性",
    icon: Zap,
    color: "text-yellow-600"
  },
  {
    title: "安全审计",
    description: "完整的操作日志，满足企业合规要求",
    icon: Lock,
    color: "text-red-600"
  }
];

const stats = [
  { label: "支持币种", value: "3+" },
  { label: "区块链网络", value: "2" },
  { label: "处理速度", value: "< 5s" },
  { label: "安全等级", value: "企业级" }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-8 flex justify-center">
              <div className="relative rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600 ring-1 ring-indigo-600/20">
                <span className="absolute inset-0 rounded-full bg-indigo-100/50"></span>
                <span className="relative">Web3 企业级报销系统</span>
              </div>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              现代化
              <span className="text-indigo-600"> 财务流程</span>
              <br />
              管理平台
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              专为 Web3 企业设计的智能报销系统，集成多链支付、实时汇率、权限管理，
              让财务流程更安全、高效、透明。
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/login"
                className="rounded-md bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all duration-200"
              >
                立即开始
                <ArrowRight className="ml-2 inline h-4 w-4" />
              </Link>
              <Link
                href="/register"
                className="text-sm font-semibold leading-6 text-gray-900 hover:text-indigo-600 transition-colors duration-200"
              >
                免费注册 <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold leading-7 text-indigo-600">企业级性能</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              值得信赖的数据
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col">
                  <dt className="text-base leading-7 text-gray-900">{stat.label}</dt>
                  <dd className="mt-1 text-2xl font-bold tracking-tight text-gray-900">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-slate-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold leading-7 text-indigo-600">核心功能</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              为企业量身定制
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              集成最先进的技术栈，提供安全、高效、易用的财务管理系统
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2">
              {features.map((feature) => (
                <div key={feature.title} className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <feature.icon className={`h-5 w-5 flex-none ${feature.color}`} aria-hidden="true" />
                    {feature.title}
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">{feature.description}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-indigo-600">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              准备开始您的财务数字化之旅？
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-indigo-200">
              立即注册，体验现代化的企业财务管理系统，让您的团队工作更高效。
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/register"
                className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-all duration-200"
              >
                免费注册
              </Link>
              <Link
                href="/login"
                className="text-sm font-semibold leading-6 text-white hover:text-indigo-200 transition-colors duration-200"
              >
                已有账户？立即登录 <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
