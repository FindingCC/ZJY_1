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
  SEVEN_DAYS: "bg-yellow-50 border-yellow-400 text-yellow-800",
  THREE_DAYS: "bg-orange-50 border-orange-400 text-orange-800",
  SAME_DAY: "bg-red-50 border-red-400 text-red-700",
  OVERDUE: "bg-red-100 border-red-600 text-red-800",
};

const ICONS: Record<string, string> = {
  SEVEN_DAYS: "⏰",
  THREE_DAYS: "⚠️",
  SAME_DAY: "🔔",
  OVERDUE: "🚨",
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
