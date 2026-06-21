"use client";

import { useState } from "react";
import { ThemeProvider } from "@/components/features/ThemeProvider";
import { SettingsModal } from "@/components/features/SettingsModal";
import { ReminderProvider } from "@/components/features/ReminderProvider";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { MobileNav } from "@/components/features/MobileNav";

import { ProjectProvider, useProject } from "@/lib/ProjectContext";
import { AuthProvider } from "@/lib/AuthContext";
import { NetworkDetect } from "@/components/features/NetworkDetect";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

function ProjectSelector() {
  const { projects, currentProject, setCurrentProject, refreshProjects, loading } = useProject();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), password }),
      });
      const json = await res.json();
      if (json.success) {
        setNewName("");
        setPassword("");
        setShowCreate(false);
        await refreshProjects();
        setCurrentProject(json.data);
      } else {
        setError(json.error || "创建失败");
      }
    } catch {
      setError("网络请求失败");
    }
    setCreating(false);
  };

  if (loading) {
    return <span className="text-white/60 text-xs">加载中...</span>;
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <select
          value={currentProject?.id || ""}
          onChange={(e) => {
            const found = projects.find((p) => p.id === parseInt(e.target.value));
            if (found) setCurrentProject(found);
          }}
          className="bg-blue-800 dark:bg-gray-700 text-white border border-blue-600 dark:border-gray-600 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-white/30 outline-none max-w-[140px] sm:max-w-[200px]"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowCreate(true)}
          className="text-white/70 hover:text-white text-lg leading-none"
          title="新建工程"
        >
          +
        </button>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="新建工程">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">工程名称</label>
            <input
              type="text" value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="输入工程名称" autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">管理员密码</label>
            <input
              type="password" value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="输入管理员密码"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => setShowCreate(false)}>取消</Button>
            <Button type="submit" loading={creating}>创建工程</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function NavBar() {
  const [showSettings, setShowSettings] = useState(false);
  return (
    <nav className="bg-blue-700 dark:bg-gray-800 text-white shadow-lg transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <a href="/" className="text-sm sm:text-lg font-bold tracking-wide whitespace-nowrap truncate">
            变电分部施工管理系统
          </a>
          <ProjectSelector />
        </div>
        <div className="flex items-center gap-3 sm:gap-5">
          {/* 桌面端导航链接 */}
          <div className="hidden md:flex items-center gap-5 text-xs whitespace-nowrap">
            <a href="/" className="hover:text-blue-200 dark:hover:text-blue-300 transition-colors">仪表盘</a>
            <a href="/nodes" className="hover:text-blue-200 dark:hover:text-blue-300 transition-colors">节点管理</a>
            <a href="/files" className="hover:text-blue-200 dark:hover:text-blue-300 transition-colors">文件归档</a>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="text-white hover:text-blue-200 transition-colors text-lg leading-none"
            title="设置"
          >
            ⚙
          </button>
        </div>
      </div>
      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ProjectProvider>
          <ReminderProvider>
            <NetworkDetect />
            <NavBar />
            <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-20 md:pb-6">
              {children}
            </main>
            <MobileNav />
            <ToastContainer />
          </ReminderProvider>
        </ProjectProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
