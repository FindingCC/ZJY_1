"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { Toast, type ToastItem } from "./Toast";

interface ToastContextType {
  addToast: (message: string, type: ToastItem["type"]) => void;
}

const ToastContext = createContext<ToastContextType>({
  addToast: () => {},
});

let toastId = 0;

export function useToast() {
  return useContext(ToastContext);
}

export function ToastContainer({ children }: { children?: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, type: ToastItem["type"]) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-[100] flex flex-col pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <Toast toast={t} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
