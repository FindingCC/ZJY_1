import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/api";
import * as fs from "fs";
import * as path from "path";

const ARCHIVES_DIR = process.env.ARCHIVES_DIR || path.join(process.cwd(), "archives");

function sanitizeDirName(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, "_").trim();
}

// PUT /api/files/[id] — 重新分配未匹配文件到指定节点
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const json = await request.json();
    const { projectNodeId, projectId } = json;

    if (!projectNodeId) {
      const body: ApiResponse = { success: false, error: "请指定目标节点" };
      return NextResponse.json(body, { status: 400 });
    }

    const fileId = parseInt(id);
    const where: Record<string, unknown> = { id: fileId };
    if (projectId) where.projectId = parseInt(projectId);

    const file = await prisma.archivedFile.findUnique({ where: where as any });
    if (!file) {
      const body: ApiResponse = { success: false, error: "文件记录不存在" };
      return NextResponse.json(body, { status: 404 });
    }

    const node = await prisma.projectNode.findUnique({ where: { id: projectNodeId } });
    if (!node) {
      const body: ApiResponse = { success: false, error: "目标节点不存在" };
      return NextResponse.json(body, { status: 404 });
    }

    // 移动物理文件
    const oldPath = path.join(process.cwd(), file.storedPath);
    const nodeDir = path.join(ARCHIVES_DIR, sanitizeDirName(node.name));
    if (!fs.existsSync(nodeDir)) fs.mkdirSync(nodeDir, { recursive: true });
    const newPath = path.join(nodeDir, file.originalName);
    if (fs.existsSync(oldPath)) {
      fs.copyFileSync(oldPath, newPath);
      fs.unlinkSync(oldPath);
    }

    const updated = await prisma.archivedFile.update({
      where: { id: parseInt(id) },
      data: {
        projectNodeId,
        storedPath: path.relative(process.cwd(), newPath),
        status: "CLASSIFIED",
      },
      include: { projectNode: { select: { id: true, name: true } } },
    });

    const body: ApiResponse = { success: true, data: updated };
    return NextResponse.json(body);
  } catch (error) {
    const body: ApiResponse = { success: false, error: String(error) };
    return NextResponse.json(body, { status: 500 });
  }
}

const DELETE_PASSWORD = "Zjy@2022..";

// DELETE /api/files/[id] — 密码保护删除归档文件
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

    const file = await prisma.archivedFile.findUnique({ where: { id: parseInt(id) } });
    if (!file) {
      const body: ApiResponse = { success: false, error: "文件记录不存在" };
      return NextResponse.json(body, { status: 404 });
    }

    // 删除物理文件
    const filePath = path.join(process.cwd(), file.storedPath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // 删除数据库记录
    await prisma.archivedFile.delete({ where: { id: parseInt(id) } });

    const body: ApiResponse = { success: true, data: { id: parseInt(id) } };
    return NextResponse.json(body);
  } catch (error) {
    const body: ApiResponse = { success: false, error: String(error) };
    return NextResponse.json(body, { status: 500 });
  }
}
