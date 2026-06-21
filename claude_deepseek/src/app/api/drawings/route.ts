import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromCookies } from "@/lib/auth";
import * as fs from "fs";
import * as path from "path";

const UPLOAD_DIR = process.env.ARCHIVES_DIR || path.join(process.cwd(), "archives");

export async function GET(request: NextRequest) {
  const user = getUserFromCookies(request.headers.get("cookie"));
  if (!user) return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const category = searchParams.get("category");
  const search = searchParams.get("search");

  if (!projectId) return NextResponse.json({ success: false, error: "缺少工程ID" }, { status: 400 });

  const where: any = { projectId: parseInt(projectId) };
  if (category) where.category = category;
  if (search) where.name = { contains: search };

  const drawings = await prisma.drawing.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: drawings });
}

export async function POST(request: NextRequest) {
  const user = getUserFromCookies(request.headers.get("cookie"));
  if (!user) return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });

  const formData = await request.formData();
  const projectId = parseInt(formData.get("projectId") as string);
  const category = formData.get("category") as string;
  const files = formData.getAll("files") as File[];

  if (!projectId || !category || !files.length) {
    return NextResponse.json({ success: false, error: "缺少参数" }, { status: 400 });
  }

  const dir = path.join(UPLOAD_DIR, `_drawings/${projectId}/${category}`);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const results = [];
  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const storedPath = path.join(dir, file.name);
    fs.writeFileSync(storedPath, buffer);
    const saved = await prisma.drawing.create({
      data: { projectId, category, name: file.name, storedPath, fileSize: buffer.length },
    });
    results.push(saved);
  }

  return NextResponse.json({ success: true, data: results });
}

export async function DELETE(request: NextRequest) {
  const user = getUserFromCookies(request.headers.get("cookie"));
  if (!user) return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });

  const { id, password } = await request.json();
  if (password !== "Zjy@2022..") {
    return NextResponse.json({ success: false, error: "密码错误" }, { status: 403 });
  }

  const drawing = await prisma.drawing.findUnique({ where: { id } });
  if (!drawing) return NextResponse.json({ success: false, error: "不存在" }, { status: 404 });

  const filePath = path.join(process.cwd(), drawing.storedPath);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  await prisma.drawing.delete({ where: { id } });
  return NextResponse.json({ success: true, data: null });
}
