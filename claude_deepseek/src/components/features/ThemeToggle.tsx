"use client";

import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-lg"
      title={theme === "dark" ? "切换浅色模式" : "切换深色模式"}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
