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
          <div className="space-y-3">
            <a 
              href="/reimbursements" 
              className="block p-3 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 text-sm">📝</span>
                </div>
                <div>
                  <p className="font-medium text-indigo-900">提交报销申请</p>
                  <p className="text-sm text-indigo-600">创建新的报销申请</p>
                </div>
              </div>
            </a>
            
            <a 
              href="/reimbursements/history" 
              className="block p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm">📊</span>
                </div>
                <div>
                  <p className="font-medium text-green-900">查看报销历史</p>
                  <p className="text-sm text-green-600">查看所有报销记录</p>
                </div>
              </div>
            </a>
          </div>
        </Card>
      </section>
    </div>
  );
}
