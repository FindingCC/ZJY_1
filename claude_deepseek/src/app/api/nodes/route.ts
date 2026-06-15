import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { daysUntilDue } from "@/lib/date";
import type { ApiResponse } from "@/types/api";

// GET /api/nodes — 获取所有节点，按逾期优先 + endDate 排序
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    const nodes = await prisma.projectNode.findMany({
      include: {
        checklistItems: true,
        template: { select: { name: true, category: true } },
      },
      orderBy: [{ order: "asc" }],
    });

    // 自动标记逾期节点
    const today = new Date().toISOString().split("T")[0];
    for (const node of nodes) {
      if (node.status !== "COMPLETED" && node.endDate && node.endDate < today) {
        await prisma.projectNode.update({
          where: { id: node.id },
          data: { status: "OVERDUE" },
        });
        node.status = "OVERDUE";
      }
    }

    // 排序：逾期置顶，然后按 endDate 升序
    const sorted = nodes.sort((a, b) => {
      if (a.status === "OVERDUE" && b.status !== "OVERDUE") return -1;
      if (a.status !== "OVERDUE" && b.status === "OVERDUE") return 1;
      const aEnd = a.endDate || "9999-12-31";
      const bEnd = b.endDate || "9999-12-31";
      return aEnd.localeCompare(bEnd);
    });

    let filtered = sorted;
    if (statusFilter) {
      filtered = sorted.filter((n) => n.status === statusFilter);
    }

    const body: ApiResponse = { success: true, data: filtered };
    return NextResponse.json(body);
  } catch (error) {
    const body: ApiResponse = { success: false, error: String(error) };
    return NextResponse.json(body, { status: 500 });
  }
}

// POST /api/nodes — 创建节点（可从模板复制 checklist）
export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const { name, description, order, startDate, endDate, templateId } = json;

    if (!name) {
      const body: ApiResponse = { success: false, error: "节点名称不能为空" };
      return NextResponse.json(body, { status: 400 });
    }

    // 从模板复制 checklist
    let checklistCreate: { content: string; order: number }[] = [];
    if (templateId) {
      const template = await prisma.constructionTemplate.findUnique({
        where: { id: templateId },
        include: { checklistItems: { orderBy: { order: "asc" } } },
      });
      if (template) {
        checklistCreate = template.checklistItems.map((ci) => ({
          content: ci.content,
          order: ci.order,
        }));
      }
    }

    const node = await prisma.projectNode.create({
      data: {
        name,
        description: description || null,
        order: order || 0,
        startDate: startDate || null,
        endDate: endDate || null,
        templateId: templateId || null,
        checklistItems: { create: checklistCreate },
      },
      include: { checklistItems: true, template: true },
    });

    const body: ApiResponse = { success: true, data: node };
    return NextResponse.json(body, { status: 201 });
  } catch (error) {
    const body: ApiResponse = { success: false, error: String(error) };
    return NextResponse.json(body, { status: 500 });
  }
}
