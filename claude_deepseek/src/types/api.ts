export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export const NODE_STATUS = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  OVERDUE: "OVERDUE",
} as const;

export type NodeStatus = (typeof NODE_STATUS)[keyof typeof NODE_STATUS];

export const STATUS_LABELS: Record<string, string> = {
  PENDING: "未开始",
  IN_PROGRESS: "进行中",
  COMPLETED: "已完成",
  OVERDUE: "逾期",
};

export const REMINDER_TYPE = {
  SEVEN_DAYS: "SEVEN_DAYS",
  THREE_DAYS: "THREE_DAYS",
  SAME_DAY: "SAME_DAY",
  OVERDUE: "OVERDUE",
} as const;

export type ReminderType = (typeof REMINDER_TYPE)[keyof typeof REMINDER_TYPE];

export const REMINDER_LABELS: Record<string, string> = {
  SEVEN_DAYS: "7天后到期",
  THREE_DAYS: "3天后到期",
  SAME_DAY: "今天到期",
  OVERDUE: "已逾期",
};

export const REMINDER_COLORS: Record<string, string> = {
  SEVEN_DAYS: "bg-yellow-50 border-yellow-400 text-yellow-800",
  THREE_DAYS: "bg-orange-50 border-orange-400 text-orange-800",
  SAME_DAY: "bg-red-50 border-red-400 text-red-700",
  OVERDUE: "bg-red-100 border-red-600 text-red-800",
};
