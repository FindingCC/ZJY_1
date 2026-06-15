"use client";

import { useEffect, useRef } from "react";
import { useToast } from "@/components/ui/ToastContainer";
import { playReminderSound } from "@/lib/sound";

const REMINDER_MESSAGES: Record<string, (name: string, days: number) => string> = {
  SEVEN_DAYS: (name, days) => `"${name}" 还有${days}天到期，请提前准备`,
  THREE_DAYS: (name, days) => `"${name}" 还有${days}天到期，请尽快处理`,
  SAME_DAY: (name) => `"${name}" 今天到期！请立即处理`,
  OVERDUE: (name, days) => `"${name}" 已逾期${days}天！请紧急处理`,
  SCHEDULED_MONTHLY: () => `📅 今天是每月1号，请报月停电计划`,
  SCHEDULED_WEEKLY_MON: () => `📅 今天是周一，请报周停电计划`,
  SCHEDULED_WEEKLY_THU: () => `📅 今天是周四，请报下周施工计划`,
};

export function ReminderProvider({ children }: { children: React.ReactNode }) {
  const { addToast } = useToast();
  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // 请求通知权限
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }

    checkReminders();
    const interval = setInterval(checkReminders, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  async function checkReminders() {
    try {
      const res = await fetch("/api/reminders");
      const json = await res.json();
      if (!json.success || !json.data?.length) return;

      for (const reminder of json.data) {
        const key = `${reminder.nodeId ?? "scheduled"}-${reminder.type}`;
        if (notifiedRef.current.has(key)) continue;
        notifiedRef.current.add(key);

        const msgFn = REMINDER_MESSAGES[reminder.type];
        const message = msgFn ? msgFn(reminder.nodeName, reminder.daysDiff) : reminder.nodeName;

        // 弹窗
        addToast(message, reminder.type);

        // 声音
        playReminderSound(reminder.type);

        // 浏览器通知
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          try {
            new Notification("三房扩2施工项目提醒", { body: message });
          } catch {
            // 忽略通知失败
          }
        }

        // 标记已发送
        await fetch("/api/reminders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nodeId: reminder.nodeId, type: reminder.type }),
        });
      }
    } catch {
      // 静默处理轮询错误
    }
  }

  return <>{children}</>;
}
