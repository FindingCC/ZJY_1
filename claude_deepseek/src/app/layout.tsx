import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/features/AppShell";

export const metadata: Metadata = {
  title: "通源变电施工管理系统",
  description: "辅助变电施工项目经理日常工作推进、时间节点提醒、报审资料生成",
};

export const viewport: Viewport = {
  themeColor: "#1d4ed8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="bg-gray-50 dark:bg-gray-950 min-h-screen">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
