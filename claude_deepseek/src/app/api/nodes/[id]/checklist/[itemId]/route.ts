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

const DELETE_PASSWORD = "Zjy@2022..";

// DELETE /api/nodes/[id]/checklist/[itemId] — 删除清单项（密码保护）
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await context.params;
    const json = await request.json();
    const { password } = json;

    if (password !== DELETE_PASSWORD) {
      const body: ApiResponse = { success: false, error: "密码错误" };
      return NextResponse.json(body, { status: 403 });
    }

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
