"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";

interface PasswordModalProps {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
}

export function PasswordModal({ open, title, message, onClose, onConfirm }: PasswordModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setError("");
    setLoading(true);
    try {
      await onConfirm(password);
      setPassword("");
      onClose();
    } catch (e) {
      setError(String(e) || "操作失败");
    }
    setLoading(false);
  };

  const handleClose = () => {
    setPassword("");
    setError("");
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title={title}>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">{message}</p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">请输入删除密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") handleConfirm(); }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="输入密码"
            autoFocus
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={handleClose}>取消</Button>
          <Button variant="danger" onClick={handleConfirm} loading={loading}>确认删除</Button>
        </div>
      </div>
    </Modal>
  );
}
