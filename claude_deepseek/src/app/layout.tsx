import type { Metadata } from "next";
import "./globals.css";
import { ReminderProvider } from "@/components/features/ReminderProvider";
import { ToastContainer } from "@/components/ui/ToastContainer";

export const metadata: Metadata = {
  title: "变电施工项目管理系统",
  description: "辅助变电施工项目经理日常工作推进、时间节点提醒、报审资料生成",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-gray-50 min-h-screen">
        <ReminderProvider>
          <nav className="bg-blue-700 text-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
              <a href="/" className="text-lg font-bold tracking-wide">
                ⚡ 变电施工项目管理系统
              </a>
              <div className="flex gap-4 text-sm">
                <a href="/" className="hover:text-blue-200 transition-colors">仪表盘</a>
                <a href="/nodes" className="hover:text-blue-200 transition-colors">节点管理</a>
              </div>
            </div>
          </nav>
          <main className="max-w-7xl mx-auto px-4 py-6">
            {children}
          </main>
          <ToastContainer />
        </ReminderProvider>
      </body>
    </html>
  );
}
