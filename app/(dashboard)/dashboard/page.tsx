import { Card } from "@/components/card";
import { MetricsGrid } from "@/components/metrics-grid";
import { RecentActivities } from "@/components/recent-activities";

export default function DashboardPage() {
  return (
    <div className="space-y-8 p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">控制台概览</h1>
        <p className="text-sm text-slate-600">查看报销进度、锁定汇率并追踪链上支付状态。</p>
      </header>

      <MetricsGrid />

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card title="最新报销活动">
          <RecentActivities />
        </Card>
        <Card title="快速入口">
          <div className="space-y-3 text-sm text-slate-600">
            <p>• 提交报销：/dashboard/reimbursements/new</p>
            <p>• 审核队列：/dashboard/reimbursements/review</p>
            <p>• 汇率快照：/dashboard/exchange</p>
          </div>
        </Card>
      </section>
    </div>
  );
}
