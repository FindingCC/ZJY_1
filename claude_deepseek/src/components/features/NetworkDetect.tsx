"use client";

import { useEffect } from "react";

/**
 * 检测是否在家庭 WiFi，自动切换到局域网地址（更快）
 * 仅当用户从外网域名访问且检测到内网可达时触发
 */
export function NetworkDetect() {
  useEffect(() => {
    // 已经是局域网地址就不用检测
    if (window.location.hostname.startsWith("192.168.") ||
        window.location.hostname === "localhost") return;

    const LAN = "http://192.168.1.2:3000";
    let redirected = false;

    const check = () => {
      const img = new Image();
      img.onload = () => {
        if (!redirected && window.location.hostname !== "192.168.1.2") {
          redirected = true;
          window.location.replace(LAN + window.location.pathname + window.location.search);
        }
      };
      // 超时 2 秒
      const timer = setTimeout(() => { img.src = ""; }, 2000);
      img.onload = () => { clearTimeout(timer); img.onload?.({} as any); };
      img.src = LAN + "/_lan-check";
    };

    // 延迟执行，等页面核心加载完
    const t = setTimeout(check, 3000);
    return () => clearTimeout(t);
  }, []);

  return null;
}
