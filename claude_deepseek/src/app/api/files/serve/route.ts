import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as fs from "fs";
import * as path from "path";

// GET /api/files/serve?id=<fileId> — 提供文件预览/下载
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "缺少文件ID" }, { status: 400 });
    }

    const file = await prisma.archivedFile.findUnique({ where: { id: parseInt(id) } });
    if (!file) {
      return NextResponse.json({ success: false, error: "文件不存在" }, { status: 404 });
    }

    const fullPath = path.join(process.cwd(), file.storedPath);
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ success: false, error: "文件已丢失" }, { status: 404 });
    }

    const buffer = fs.readFileSync(fullPath);
    const ext = path.extname(file.originalName).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".heic": "image/heic",
      ".pdf": "application/pdf",
      ".doc": "application/msword",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".xls": "application/vnd.ms-excel",
      ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
    const mimeType = mimeTypes[ext] || "application/octet-stream";
    const inlineTypes = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf"];
    const disposition = inlineTypes.includes(ext) ? "inline" : "attachment";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `${disposition}; filename="${encodeURIComponent(file.originalName)}"`,
        "Content-Length": String(buffer.length),
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
