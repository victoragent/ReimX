import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AuthShellProps {
  title: string;
  description: string;
  children: ReactNode;
  illustration?: ReactNode;
  className?: string;
}

export function AuthShell({ title, description, children, illustration, className }: AuthShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-slate-50 to-slate-100">
      <div className="absolute inset-0 -z-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(120%_120%_at_50%_0%,rgba(79,70,229,0.18),rgba(14,165,233,0.12),transparent)]" />
      </div>
      <div className={cn("mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-12 px-4 py-16 sm:px-8 lg:px-12", className)}>
        <div className="grid gap-10 lg:grid-cols-[0.8fr,1.4fr] lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium uppercase tracking-[0.3em] text-slate-600">
              ReimX
            </span>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
                {title}
              </h1>
              <p className="text-lg leading-relaxed text-slate-600 sm:text-xl">
                {description}
              </p>
            </div>
            {illustration ?? (
              <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
                  · 多角色权限与审批流
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
                  · Web3 钱包地址管理
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
                  · 实时通知与审批记录
                </div>
              </div>
            )}
          </div>
          <div className="relative">
            <div className="absolute inset-0 -z-10 translate-x-6 translate-y-6 rounded-3xl bg-gradient-to-br from-indigo-200/60 via-sky-200/40 to-transparent blur-3xl" />
            <div className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-xl backdrop-blur">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

