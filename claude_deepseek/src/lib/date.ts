/**
 * 计算 endDate 距离今天还有多少天。
 * 负数表示已逾期。
 */
export function daysUntilDue(endDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate + "T00:00:00");
  const diff = end.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "未设置";
  return dateStr;
}

export function getToday(): string {
  return new Date().toISOString().split("T")[0];
}
