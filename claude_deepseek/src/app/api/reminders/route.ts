import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { daysUntilDue } from "@/lib/date";
import type { ApiResponse } from "@/types/api";

interface PendingReminder {
  nodeId: number | null;
  nodeName: string;
  endDate: string;
  type: string;
  daysDiff: number;
}

// 定期计划提醒配置
const SCHEDULED_REMINDERS = [
  {
    name: "报月停电计划",
    type: "SCHEDULED_MONTHLY",
    check: (d: Date) => d.getDate() === 1,
    message: "今天是每月1号，请报月停电计划",
  },
  {
    name: "报周停电计划",
    type: "SCHEDULED_WEEKLY_MON",
    check: (d: Date) => d.getDay() === 1, // 周一
    message: "今天是周一，请报周停电计划",
  },
  {
    name: "报下周施工计划",
    type: "SCHEDULED_WEEKLY_THU",
    check: (d: Date) => d.getDay() === 4, // 周四
    message: "今天是周四，请报下周施工计划",
  },
];

// GET /api/reminders — 检查待触发的提醒（节点到期 + 定期计划）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ success: false, error: "缺少工程ID" }, { status: 400 });
    }

    const now = new Date();
    const today = now.toISOString().split("T")[0];

    // 自动标记逾期节点
    const nodes = await prisma.projectNode.findMany({
      where: { projectId: parseInt(projectId) },
      select: { id: true, name: true, endDate: true, status: true },
    });
    for (const node of nodes) {
      if (node.status !== "COMPLETED" && node.endDate && node.endDate < today && node.status !== "OVERDUE") {
        await prisma.projectNode.update({
          where: { id: node.id },
          data: { status: "OVERDUE" },
        });
      }
    }

    const logs = await prisma.reminderLog.findMany({
      select: { projectNodeId: true, reminderType: true },
    });
    const pending: PendingReminder[] = [];

    // --- 节点到期提醒 ---
    for (const node of nodes) {
      if (node.status === "COMPLETED" || !node.endDate) continue;
      const diff = daysUntilDue(node.endDate);
      const alreadySent = (type: string) =>
        logs.some((l) => l.projectNodeId === node.id && l.reminderType === type);

      if (diff < 0 && !alreadySent("OVERDUE")) {
        pending.push({ nodeId: node.id, nodeName: node.name, endDate: node.endDate, type: "OVERDUE", daysDiff: Math.abs(diff) });
      } else if (diff === 0 && !alreadySent("SAME_DAY")) {
        pending.push({ nodeId: node.id, nodeName: node.name, endDate: node.endDate, type: "SAME_DAY", daysDiff: 0 });
      } else if (diff > 0 && diff <= 3 && !alreadySent("THREE_DAYS")) {
        pending.push({ nodeId: node.id, nodeName: node.name, endDate: node.endDate, type: "THREE_DAYS", daysDiff: diff });
      } else if (diff > 3 && diff <= 7 && !alreadySent("SEVEN_DAYS")) {
        pending.push({ nodeId: node.id, nodeName: node.name, endDate: node.endDate, type: "SEVEN_DAYS", daysDiff: diff });
      }
    }

    // --- 定期计划提醒 ---
    for (const sr of SCHEDULED_REMINDERS) {
      if (!sr.check(now)) continue;
      const alreadySent = logs.some((l) => l.projectNodeId === null && l.reminderType === sr.type);
      if (!alreadySent) {
        pending.push({ nodeId: null, nodeName: sr.name, endDate: today, type: sr.type, daysDiff: 0 });
      }
    }

    const body: ApiResponse = { success: true, data: pending };
    return NextResponse.json(body);
  } catch (error) {
    const body: ApiResponse = { success: false, error: String(error) };
    return NextResponse.json(body, { status: 500 });
  }
}

// POST /api/reminders — 标记提醒已发送
export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const { nodeId, type } = json;

    const log = await prisma.reminderLog.create({
      data: {
        projectNodeId: nodeId ?? null,
        reminderType: type,
      },
    });

    const body: ApiResponse = { success: true, data: log };
    return NextResponse.json(body, { status: 201 });
  } catch (error) {
    const body: ApiResponse = { success: false, error: String(error) };
    return NextResponse.json(body, { status: 500 });
  }
}
