const activities = [
  {
    title: "市场拓展差旅",
    applicant: "Alice",
    amount: "1,200 USD",
    status: "审核中",
    timestamp: "2 小时前"
  },
  {
    title: "社区赞助费用",
    applicant: "Bob",
    amount: "8,500 RMB",
    status: "已批准",
    timestamp: "昨天"
  },
  {
    title: "Solana 验证节点运维",
    applicant: "Carol",
    amount: "640 USD",
    status: "已付款",
    timestamp: "2 天前"
  }
];

export function RecentActivities() {
  return (
    <ul className="space-y-4 text-sm text-slate-600">
      {activities.map((activity) => (
        <li key={`${activity.title}-${activity.timestamp}`} className="flex items-start justify-between gap-4">
          <div>
            <p className="font-medium text-slate-900">{activity.title}</p>
            <p className="text-xs text-slate-500">申请人：{activity.applicant}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-slate-900">{activity.amount}</p>
            <p className="text-xs text-slate-500">
              {activity.status} · {activity.timestamp}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
