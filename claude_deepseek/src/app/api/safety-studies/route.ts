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
  if (!projectId) return NextResponse.json({ success: false, error: "缺少工程ID" }, { status: 400 });

  const studies = await prisma.safetyStudy.findMany({
    where: { projectId: parseInt(projectId) },
    include: { files: true },
    orderBy: { weekStart: "desc" },
  });

  return NextResponse.json({ success: true, data: studies });
}

export async function POST(request: NextRequest) {
  const user = getUserFromCookies(request.headers.get("cookie"));
  if (!user) return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });

  const formData = await request.formData();
  const projectId = parseInt(formData.get("projectId") as string);
  const safetyStudyId = parseInt(formData.get("safetyStudyId") as string);
  const files = formData.getAll("files") as File[];

  if (!files.length) return NextResponse.json({ success: false, error: "没有上传文件" }, { status: 400 });

  const dir = path.join(UPLOAD_DIR, `_safety/${projectId}/${safetyStudyId}`);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const results = [];
  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const storedPath = path.join(dir, file.name);
    fs.writeFileSync(storedPath, buffer);
    const saved = await prisma.safetyStudyFile.create({
      data: { safetyStudyId, originalName: file.name, storedPath: path.relative(process.cwd(), storedPath), fileSize: buffer.length },
    });
    results.push(saved);
  }

  return NextResponse.json({ success: true, data: results });
}

const DELETE_PASSWORD = "Zjy@2022..";

export async function DELETE(request: NextRequest) {
  const user = getUserFromCookies(request.headers.get("cookie"));
  if (!user) return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });

  const json = await request.json();
  const { password, fileId } = json;

  if (password !== DELETE_PASSWORD) {
    return NextResponse.json({ success: false, error: "密码错误" }, { status: 403 });
  }

  if (!fileId) return NextResponse.json({ success: false, error: "缺少文件ID" }, { status: 400 });

  const file = await prisma.safetyStudyFile.findUnique({ where: { id: fileId } });
  if (!file) return NextResponse.json({ success: false, error: "文件不存在" }, { status: 404 });

  // 删除磁盘文件
  const fullPath = file.storedPath.startsWith("/") ? file.storedPath : path.join(process.cwd(), file.storedPath);
  if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);

  await prisma.safetyStudyFile.delete({ where: { id: file.id } });

  return NextResponse.json({ success: true, data: { id: file.id } });
}
