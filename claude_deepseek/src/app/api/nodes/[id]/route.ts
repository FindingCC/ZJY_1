import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/api";

// GET /api/nodes/[id] — 获取节点详情
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const node = await prisma.projectNode.findUnique({
      where: { id: parseInt(id) },
      include: {
        checklistItems: { orderBy: { order: "asc" } },
        template: true,
      },
    });
    if (!node) {
      const body: ApiResponse = { success: false, error: "节点不存在" };
      return NextResponse.json(body, { status: 404 });
    }
    const body: ApiResponse = { success: true, data: node };
    return NextResponse.json(body);
  } catch (error) {
    const body: ApiResponse = { success: false, error: String(error) };
    return NextResponse.json(body, { status: 500 });
  }
}

// PUT /api/nodes/[id] — 更新节点
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const json = await request.json();
    const { name, description, order, startDate, endDate, status } = json;

    const node = await prisma.projectNode.update({
      where: { id: parseInt(id) },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(order !== undefined && { order }),
        ...(startDate !== undefined && { startDate }),
        ...(endDate !== undefined && { endDate }),
        ...(status !== undefined && { status }),
      },
      include: { checklistItems: true, template: true },
    });

    const body: ApiResponse = { success: true, data: node };
    return NextResponse.json(body);
  } catch (error) {
    const body: ApiResponse = { success: false, error: String(error) };
    return NextResponse.json(body, { status: 500 });
  }
}

const DELETE_PASSWORD = "Zjy@2022..";

// DELETE /api/nodes/[id] — 删除节点（密码保护，级联删除 checklist + reminder logs）
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const json = await request.json();
    const { password } = json;

    if (password !== DELETE_PASSWORD) {
      const body: ApiResponse = { success: false, error: "密码错误" };
      return NextResponse.json(body, { status: 403 });
    }

    await prisma.projectNode.delete({ where: { id: parseInt(id) } });
    const body: ApiResponse = { success: true, data: { id: parseInt(id) } };
    return NextResponse.json(body);
  } catch (error) {
    const body: ApiResponse = { success: false, error: String(error) };
    return NextResponse.json(body, { status: 500 });
  }
}
