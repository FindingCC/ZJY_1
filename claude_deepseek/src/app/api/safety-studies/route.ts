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
