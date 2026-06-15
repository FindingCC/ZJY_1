import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/features/ThemeProvider";
import { ThemeToggle } from "@/components/features/ThemeToggle";
import { ReminderProvider } from "@/components/features/ReminderProvider";
import { ToastContainer } from "@/components/ui/ToastContainer";

export const metadata: Metadata = {
  title: "三房扩2施工项目管理系统",
  description: "辅助三房扩2施工项目经理日常工作推进、时间节点提醒、报审资料生成",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="bg-gray-50 dark:bg-gray-950 min-h-screen">
        <ThemeProvider>
          <ReminderProvider>
            <nav className="bg-blue-700 dark:bg-gray-800 text-white shadow-lg transition-colors">
              <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
                <a href="/" className="text-lg font-bold tracking-wide whitespace-nowrap">
                  三房扩2施工项目管理系统
                </a>
                <div className="flex items-center gap-5 text-xs ml-8 whitespace-nowrap">
                  <a href="/" className="hover:text-blue-200 dark:hover:text-blue-300 transition-colors">仪表盘</a>
                  <a href="/nodes" className="hover:text-blue-200 dark:hover:text-blue-300 transition-colors">节点管理</a>
                  <a href="/files" className="hover:text-blue-200 dark:hover:text-blue-300 transition-colors">文件归档</a>
                  <ThemeToggle />
                </div>
              </div>
            </nav>
            <main className="max-w-7xl mx-auto px-4 py-6">
              {children}
            </main>
            <ToastContainer />
          </ReminderProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
