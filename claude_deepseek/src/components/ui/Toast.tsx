"use client";

import { useEffect, useState } from "react";

export interface ToastItem {
  id: number;
  message: string;
  type: "SEVEN_DAYS" | "THREE_DAYS" | "SAME_DAY" | "OVERDUE";
}

interface ToastProps {
  toast: ToastItem;
  onRemove: (id: number) => void;
}

const STYLES: Record<string, string> = {
  SEVEN_DAYS: "bg-yellow-50 dark:bg-yellow-900/30 border-yellow-400 text-yellow-800 dark:text-yellow-200",
  THREE_DAYS: "bg-orange-50 dark:bg-orange-900/30 border-orange-400 text-orange-800 dark:text-orange-200",
  SAME_DAY: "bg-red-50 dark:bg-red-900/30 border-red-400 text-red-700 dark:text-red-200",
  OVERDUE: "bg-red-100 dark:bg-red-900/40 border-red-600 text-red-800 dark:text-red-200",
  SCHEDULED_MONTHLY: "bg-blue-50 dark:bg-blue-900/30 border-blue-400 text-blue-800 dark:text-blue-200",
  SCHEDULED_WEEKLY_MON: "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-400 text-indigo-800 dark:text-indigo-200",
  SCHEDULED_WEEKLY_THU: "bg-violet-50 dark:bg-violet-900/30 border-violet-400 text-violet-800 dark:text-violet-200",
};

const ICONS: Record<string, string> = {
  SEVEN_DAYS: "⏰",
  THREE_DAYS: "⚠️",
  SAME_DAY: "🔔",
  OVERDUE: "🚨",
  SCHEDULED_MONTHLY: "📅",
  SCHEDULED_WEEKLY_MON: "📅",
  SCHEDULED_WEEKLY_THU: "📅",
};

export function Toast({ toast, onRemove }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(toast.id), 300);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <div
      className={`border-l-4 rounded-lg shadow-lg p-4 mb-2 transition-all duration-300 ${
        STYLES[toast.type]
      } ${visible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}`}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{ICONS[toast.type]}</span>
        <p className="text-sm font-medium">{toast.message}</p>
        <button
          onClick={() => {
            setVisible(false);
            setTimeout(() => onRemove(toast.id), 300);
          }}
          className="ml-auto text-current opacity-50 hover:opacity-100"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
