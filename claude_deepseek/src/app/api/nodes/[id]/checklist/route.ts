import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/api";

// GET /api/nodes/[id]/checklist — 获取清单项列表
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const items = await prisma.checklistItem.findMany({
      where: { projectNodeId: parseInt(id) },
      orderBy: { order: "asc" },
    });
    const body: ApiResponse = { success: true, data: items };
    return NextResponse.json(body);
  } catch (error) {
    const body: ApiResponse = { success: false, error: String(error) };
    return NextResponse.json(body, { status: 500 });
  }
}

// POST /api/nodes/[id]/checklist — 新增清单项
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const json = await request.json();
    const { content } = json;

    if (!content) {
      const body: ApiResponse = { success: false, error: "清单内容不能为空" };
      return NextResponse.json(body, { status: 400 });
    }

    // 获取最大 order
    const maxOrder = await prisma.checklistItem.findFirst({
      where: { projectNodeId: parseInt(id) },
      orderBy: { order: "desc" },
    });

    const item = await prisma.checklistItem.create({
      data: {
        content,
        order: (maxOrder?.order || 0) + 1,
        projectNodeId: parseInt(id),
      },
    });

    const body: ApiResponse = { success: true, data: item };
    return NextResponse.json(body, { status: 201 });
  } catch (error) {
    const body: ApiResponse = { success: false, error: String(error) };
    return NextResponse.json(body, { status: 500 });
  }
}
