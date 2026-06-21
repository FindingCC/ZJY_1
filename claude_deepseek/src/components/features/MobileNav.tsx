"use client";

import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "仪表盘", icon: "📊" },
  { href: "/nodes", label: "节点", icon: "📋" },
  { href: "/safety", label: "安全", icon: "🦺" },
  { href: "/drawings", label: "图纸", icon: "📐" },
  { href: "/files", label: "归档", icon: "📁" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {TABS.map((tab) => {
          const isActive =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);
          return (
            <a
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 h-full text-xs font-medium transition-colors ${
                isActive
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              <span className="leading-none">{tab.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
