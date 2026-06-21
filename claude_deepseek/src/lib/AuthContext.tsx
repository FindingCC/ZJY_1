"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";

export interface AuthUser {
  id: number;
  username: string;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<string | null>;
  register: (username: string, password: string, adminPassword: string) => Promise<string | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => null,
  register: async () => null,
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const pendingRef = useRef(true);

  const logout = useCallback(async () => {
    await fetch("/api/auth/me", { method: "POST" });
    setUser(null);
    window.location.href = "/login";
  }, []);

  const handleKicked = useCallback((msg: string) => {
    setUser(null);
    // 使用简短延迟让 toast 能渲染
    setTimeout(() => {
      alert(msg);
      window.location.href = "/login";
    }, 100);
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((res) => {
        if (pendingRef.current && res.success) setUser(res.data);
        if (res.kicked) handleKicked(res.error || "你的账号已在其他设备登录，你已被踢下线");
      })
      .finally(() => { setLoading(false); pendingRef.current = false; });
  }, [handleKicked]);

  // 每 30 秒检测是否被踢
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/auth/me");
        const json = await res.json();
        if (json.kicked) {
          clearInterval(interval);
          handleKicked(json.error || "你的账号已在其他设备登录，你已被踢下线");
        }
      } catch {}
    }, 30000);
    return () => clearInterval(interval);
  }, [handleKicked]);

  const login = useCallback(async (username: string, password: string): Promise<string | null> => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const json = await res.json();
    if (json.success) {
      setUser(json.data);
      pendingRef.current = false;
      return null;
    }
    return json.error || "登录失败";
  }, []);

  const register = useCallback(async (username: string, password: string, adminPassword: string): Promise<string | null> => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, adminPassword }),
    });
    const json = await res.json();
    if (json.success) {
      return null;
    }
    return json.error || "注册失败";
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
