import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as fs from "fs";
import * as path from "path";
import type { ApiResponse } from "@/types/api";

const RECEIPTS_DIR = path.join(process.cwd(), "archives", "_receipts");

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// GET /api/receipts?projectId=1
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json({ success: false, error: "缺少工程ID" }, { status: 400 });
    }

    const receipts = await prisma.receipt.findMany({
      where: { projectId: parseInt(projectId) },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: receipts } as ApiResponse);
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) } as ApiResponse, { status: 500 });
  }
}

// POST /api/receipts — 上传收货单
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const projectId = formData.get("projectId") as string;
    const receivedAt = formData.get("receivedAt") as string | null;
    const supplier = formData.get("supplier") as string | null;
    const remark = formData.get("remark") as string | null;

    if (!files.length) {
      return NextResponse.json({ success: false, error: "没有上传文件" } as ApiResponse, { status: 400 });
    }
    if (!projectId) {
      return NextResponse.json({ success: false, error: "缺少工程ID" } as ApiResponse, { status: 400 });
    }

    ensureDir(RECEIPTS_DIR);
    const pid = parseInt(projectId);
    const created = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const originalName = file.name;
      const fileSize = buffer.length;

      // 去重
      const dup = await prisma.receipt.findFirst({
        where: { projectId: pid, originalName, fileSize },
      });
      if (dup) {
        created.push({ originalName, status: "SKIPPED", error: "文件已存在" });
        continue;
      }

      // 避免重名
      let savePath = path.join(RECEIPTS_DIR, originalName);
      let counter = 1;
      const ext = path.extname(originalName);
      const base = path.basename(originalName, ext);
      while (fs.existsSync(savePath)) {
        savePath = path.join(RECEIPTS_DIR, `${base}_${counter}${ext}`);
        counter++;
      }
      fs.writeFileSync(savePath, buffer);

      const record = await prisma.receipt.create({
        data: {
          projectId: pid,
          originalName,
          storedPath: path.relative(process.cwd(), savePath),
          fileSize,
          receivedAt,
          supplier,
          remark,
        },
      });

      created.push({ id: record.id, originalName, status: "OK" });
    }

    return NextResponse.json({ success: true, data: { created, total: files.length } } as ApiResponse);
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) } as ApiResponse, { status: 500 });
  }
}
