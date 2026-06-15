import type { ApiResponse } from "@/types/api";

export async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    const json = await res.json();
    return json as ApiResponse<T>;
  } catch {
    return { success: false, error: "网络请求失败" };
  }
}
