import { TrendingUp, Wallet, Workflow } from "lucide-react";
import { Card } from "./card";

const metrics = [
  {
    name: "USD 总支出",
    value: "$28,450",
    helper: "本季度经批准报销总额",
    icon: Wallet
  },
  {
    name: "审批通过率",
    value: "87%",
    helper: "最近 30 天的审核通过比例",
    icon: TrendingUp
  },
  {
    name: "平均处理时长",
    value: "16h",
    helper: "从提交到审核的平均时间",
    icon: Workflow
  }
];

export function MetricsGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {metrics.map((metric) => (
        <Card key={metric.name} className="space-y-3">
          <metric.icon className="h-5 w-5 text-primary" />
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">{metric.name}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{metric.value}</p>
            <p className="text-xs text-slate-500">{metric.helper}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
