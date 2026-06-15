interface StatsBarProps {
  total: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

export function StatsBar({ total, inProgress, completed, overdue }: StatsBarProps) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <StatBox label="总计" value={total} color="text-gray-700" bg="bg-gray-50" href="/nodes" />
      <StatBox label="进行中" value={inProgress} color="text-blue-700" bg="bg-blue-50" href="/nodes?status=IN_PROGRESS" />
      <StatBox label="已完成" value={completed} color="text-green-700" bg="bg-green-50" href="/nodes?status=COMPLETED" />
      <StatBox label="逾期" value={overdue} color="text-red-700" bg="bg-red-50" href="/nodes?status=OVERDUE" pulse={overdue > 0} />
    </div>
  );
}

function StatBox({ label, value, color, bg, href, pulse }: {
  label: string; value: number; color: string; bg: string; href: string; pulse?: boolean;
}) {
  return (
    <a
      href={href}
      className={`${bg} dark:bg-opacity-20 rounded-xl p-4 text-center hover:shadow-md transition-shadow cursor-pointer block ${pulse ? "animate-pulse-red" : ""}`}
    >
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </a>
  );
}
