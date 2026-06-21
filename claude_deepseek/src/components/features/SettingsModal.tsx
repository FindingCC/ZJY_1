"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/AuthContext";
import { useTheme } from "@/components/features/ThemeProvider";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: Props) {
  const { user, logout, register } = useAuth();
  const { theme, setTheme } = useTheme();
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [adminPwd, setAdminPwd] = useState("");
  const [regError, setRegError] = useState("");
  const [regSaving, setRegSaving] = useState(false);
  const [regOk, setRegOk] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    fetch("/api/auth/profile")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setDisplayName(res.data.displayName || "");
          setPhone(res.data.phone || "");
        }
      });
  }, [open, user]);

  const handleSave = async () => {
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/auth/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: displayName.trim() || null, phone: phone.trim() || null }),
    });
    const json = await res.json();
    if (json.success) {
      setMsg("已保存");
    } else {
      setMsg(json.error || "保存失败");
    }
    setSaving(false);
  };

  return (
    <Modal open={open} onClose={onClose} title="设置">
      <div className="space-y-6">
        {/* 当前账号信息 */}
        <div>
          <h4 className="text-sm font-semibold text-gray-500 mb-3">账号信息</h4>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-3">
            <div>
              <label className="text-xs text-gray-400">用户名（不可修改）</label>
              <input
                type="text" value={user?.username || ""} disabled
                className="w-full border border-gray-200 dark:border-gray-600 rounded px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">姓名</label>
              <input
                type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="输入姓名"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">手机号</label>
              <input
                type="text" value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="输入手机号"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">角色</label>
              <input
                type="text" value={user?.role === "ADMIN" ? "管理员" : "普通用户"} disabled
                className="w-full border border-gray-200 dark:border-gray-600 rounded px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Button variant="ghost" size="sm" onClick={handleSave} loading={saving}>保存</Button>
            {msg && <span className={`text-xs ${msg === "已保存" ? "text-green-600" : "text-red-600"}`}>{msg}</span>}
          </div>
        </div>

        {/* 显示设置 */}
        <div>
          <h4 className="text-sm font-semibold text-gray-500 mb-3">显示</h4>
          <div className="flex gap-2">
            <button
              onClick={() => setTheme("light")}
              className={`flex-1 py-2 px-3 rounded-lg text-sm border transition-colors ${theme === "light" ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"}`}
            >
              浅色模式
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`flex-1 py-2 px-3 rounded-lg text-sm border transition-colors ${theme === "dark" ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"}`}
            >
              深色模式
            </button>
          </div>
        </div>

        {/* 创建账号（仅管理员） */}
        {user?.role === "ADMIN" && (
          <div>
            <h4 className="text-sm font-semibold text-gray-500 mb-3">创建账号</h4>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-3">
              <input
                type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="新用户名"
              />
              <input
                type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="登录密码（至少4位）"
              />
              <input
                type="password" value={adminPwd} onChange={(e) => { setAdminPwd(e.target.value); setRegError(""); }}
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="管理员密码确认"
              />
            </div>
            {regError && <p className="text-xs text-red-600 mt-1">{regError}</p>}
            {regOk && <p className="text-xs text-green-600 mt-1">账号已创建</p>}
            <div className="mt-2">
              <Button
                variant="ghost" size="sm"
                loading={regSaving}
                onClick={async () => {
                  setRegSaving(true); setRegError(""); setRegOk(false);
                  const err = await register(newUsername.trim(), newPassword, adminPwd);
                  if (err) { setRegError(err); } else { setNewUsername(""); setNewPassword(""); setAdminPwd(""); setRegOk(true); }
                  setRegSaving(false);
                }}
              >
                创建账号
              </Button>
            </div>
          </div>
        )}

        {/* 系统信息 */}
        <div className="text-center text-xs text-gray-400 space-y-1">
          <p>通源变电施工管理系统 v2.0</p>
        </div>

        {/* 退出登录 */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <Button variant="danger" className="w-full" onClick={logout}>
            退出登录
          </Button>
        </div>
      </div>
    </Modal>
  );
}
