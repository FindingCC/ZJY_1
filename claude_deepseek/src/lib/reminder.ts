import { daysUntilDue } from "./date";

export interface PendingReminder {
  nodeId: number;
  nodeName: string;
  endDate: string;
  type: "SEVEN_DAYS" | "THREE_DAYS" | "SAME_DAY" | "OVERDUE";
  daysDiff: number;
}

/**
 * 检查节点列表，返回需要触发的提醒。
 * 去重逻辑由调用方传入已发送记录处理（在 API 层用 ReminderLog 去重）。
 */
export function checkReminders(
  nodes: { id: number; name: string; endDate: string | null; status: string }[]
): PendingReminder[] {
  const pending: PendingReminder[] = [];

  for (const node of nodes) {
    if (node.status === "COMPLETED") continue;
    if (!node.endDate) continue;

    const diff = daysUntilDue(node.endDate);

    if (diff < 0) {
      pending.push({ nodeId: node.id, nodeName: node.name, endDate: node.endDate, type: "OVERDUE", daysDiff: Math.abs(diff) });
    } else if (diff === 0) {
      pending.push({ nodeId: node.id, nodeName: node.name, endDate: node.endDate, type: "SAME_DAY", daysDiff: 0 });
    } else if (diff <= 3) {
      pending.push({ nodeId: node.id, nodeName: node.name, endDate: node.endDate, type: "THREE_DAYS", daysDiff: diff });
    } else if (diff <= 7) {
      pending.push({ nodeId: node.id, nodeName: node.name, endDate: node.endDate, type: "SEVEN_DAYS", daysDiff: diff });
    }
  }
  return pending;
}
