const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300",
  IN_PROGRESS: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  COMPLETED: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
  OVERDUE: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "未开始",
  IN_PROGRESS: "进行中",
  COMPLETED: "已完成",
  OVERDUE: "逾期",
};

interface BadgeProps {
  status: string;
}

export function Badge({ status }: BadgeProps) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.PENDING;
  const label = STATUS_LABELS[status] || status;

  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
      {label}
    </span>
  );
}
