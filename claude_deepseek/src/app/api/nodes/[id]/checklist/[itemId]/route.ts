import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/api";

// PUT /api/nodes/[id]/checklist/[itemId] — 更新/勾选清单项
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await context.params;
    const json = await request.json();
    const { content, isCompleted } = json;

    const item = await prisma.checklistItem.update({
      where: { id: parseInt(itemId), projectNodeId: parseInt(id) },
      data: {
        ...(content !== undefined && { content }),
        ...(isCompleted !== undefined && { isCompleted }),
      },
    });

    const body: ApiResponse = { success: true, data: item };
    return NextResponse.json(body);
  } catch (error) {
    const body: ApiResponse = { success: false, error: String(error) };
    return NextResponse.json(body, { status: 500 });
  }
}

// DELETE /api/nodes/[id]/checklist/[itemId] — 删除清单项
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await context.params;
    await prisma.checklistItem.delete({
      where: { id: parseInt(itemId), projectNodeId: parseInt(id) },
    });
    const body: ApiResponse = { success: true, data: { id: parseInt(itemId) } };
    return NextResponse.json(body);
  } catch (error) {
    const body: ApiResponse = { success: false, error: String(error) };
    return NextResponse.json(body, { status: 500 });
  }
}
