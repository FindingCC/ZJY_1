import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromCookies } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";

/** 获取某周的周一和周日 */
function getWeekRange(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // 周日算上周
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { monday, sunday };
}

/** 格式化 MM.DD */
const fmt = (d: Date) => `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, "0")}`;
const fmtISO = (d: Date) => d.toISOString().split("T")[0];

export async function POST(request: NextRequest) {
  const user = getUserFromCookies(request.headers.get("cookie"));
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "仅管理员可操作" }, { status: 403 });
  }

  try {
    const { projectId, startDate } = await request.json();
    if (!projectId || !startDate) {
      return NextResponse.json({ success: false, error: "缺少工程ID或进场时间" }, { status: 400 });
    }

    const now = new Date();
    let cursor = new Date(startDate);
    let created = 0;

    while (cursor <= now) {
      const { monday, sunday } = getWeekRange(cursor);
      const weekStart = fmtISO(monday);
      const weekEnd = fmtISO(sunday);

      // 检查是否已存在
      const existing = await prisma.safetyStudy.findFirst({
        where: { projectId, weekStart },
      });
      if (!existing) {
        await prisma.safetyStudy.create({
          data: {
            projectId,
            weekLabel: `${fmt(monday)}-${fmt(sunday)}周`,
            weekStart,
            weekEnd,
          },
        });
        created++;
      }
      // 跳到下周
      cursor.setDate(cursor.getDate() + 7);
    }

    const body: ApiResponse = { success: true, data: { created } };
    return NextResponse.json(body);
  } catch {
    return NextResponse.json({ success: false, error: "初始化失败" }, { status: 500 });
  }
}
