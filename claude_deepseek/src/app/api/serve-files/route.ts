import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as fs from "fs";
import * as path from "path";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const type = searchParams.get("type") || "drawing";

  if (!id) return NextResponse.json({ success: false, error: "缺少ID" }, { status: 400 });

  let record: { name: string; storedPath: string } | null = null;
  if (type === "safety") {
    const f = await prisma.safetyStudyFile.findUnique({ where: { id: parseInt(id) } });
    if (f) record = { name: f.originalName, storedPath: f.storedPath };
  } else if (type === "receipt") {
    const r = await prisma.receipt.findUnique({ where: { id: parseInt(id) } });
    if (r) record = { name: r.originalName, storedPath: r.storedPath };
  } else {
    const d = await prisma.drawing.findUnique({ where: { id: parseInt(id) } });
    if (d) record = { name: d.name, storedPath: d.storedPath };
  }

  if (!record) return NextResponse.json({ success: false, error: "不存在" }, { status: 404 });

  const fullPath = record.storedPath.startsWith("/") ? record.storedPath : path.join(process.cwd(), record.storedPath);
  if (!fs.existsSync(fullPath)) return NextResponse.json({ success: false, error: "文件已丢失" }, { status: 404 });

  const buffer = fs.readFileSync(fullPath);
  const ext = path.extname(record.name).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
    ".gif": "image/gif", ".webp": "image/webp", ".heic": "image/heic",
    ".pdf": "application/pdf", ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
  const mimeType = mimeTypes[ext] || "application/octet-stream";
  // 只有图片和PDF浏览器能原生渲染，Office文件强制下载
  const inlineTypes = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf"];
  const disposition = inlineTypes.includes(ext) ? "inline" : "attachment";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": `${disposition}; filename="${encodeURIComponent(record.name)}"`,
      "Content-Length": String(buffer.length),
      "Cache-Control": "public, max-age=86400",
    },
  });
}
