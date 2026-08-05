import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as fs from "fs";
import * as path from "path";
import type { ApiResponse } from "@/types/api";

// DELETE /api/receipts/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { password } = await request.json();

    if (password !== "Zjy@2022..") {
      return NextResponse.json({ success: false, error: "密码错误" } as ApiResponse, { status: 403 });
    }

    const receipt = await prisma.receipt.findUnique({ where: { id: parseInt(id) } });
    if (!receipt) {
      return NextResponse.json({ success: false, error: "记录不存在" } as ApiResponse, { status: 404 });
    }

    // 删磁盘文件
    const filePath = path.join(process.cwd(), receipt.storedPath);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await prisma.receipt.delete({ where: { id: parseInt(id) } });

    return NextResponse.json({ success: true } as ApiResponse);
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) } as ApiResponse, { status: 500 });
  }
}
