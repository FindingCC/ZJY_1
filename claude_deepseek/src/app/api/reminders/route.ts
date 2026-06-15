import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { daysUntilDue } from "@/lib/date";
import type { ApiResponse } from "@/types/api";

// GET /api/reminders — 检查待触发的提醒
export async function GET() {
  try {
    const nodes = await prisma.projectNode.findMany({
      select: { id: true, name: true, endDate: true, status: true },
    });

    const today = new Date().toISOString().split("T")[0];

    // 自动标记逾期
    for (const node of nodes) {
      if (node.status !== "COMPLETED" && node.endDate && node.endDate < today && node.status !== "OVERDUE") {
        await prisma.projectNode.update({
          where: { id: node.id },
          data: { status: "OVERDUE" },
        });
      }
    }

    // 获取已有提醒记录
    const logs = await prisma.reminderLog.findMany({
      select: { projectNodeId: true, reminderType: true },
    });

    const pending: {
      nodeId: number;
      nodeName: string;
      endDate: string;
      type: string;
      daysDiff: number;
    }[] = [];

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
        projectNodeId: nodeId,
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
