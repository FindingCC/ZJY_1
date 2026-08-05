import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromCookies } from "@/lib/auth";
import * as fs from "fs";
import * as path from "path";

const DELETE_PASSWORD = "Zjy@2022..";
const UPLOAD_DIR = process.env.ARCHIVES_DIR || path.join(process.cwd(), "archives");

export async function PATCH(request: NextRequest) {
  const user = getUserFromCookies(request.headers.get("cookie"));
  if (!user) return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });

  const json = await request.json();
  const { password, fileId, targetStudyId } = json;

  if (password !== DELETE_PASSWORD) {
    return NextResponse.json({ success: false, error: "密码错误" }, { status: 403 });
  }
  if (!fileId || !targetStudyId) {
    return NextResponse.json({ success: false, error: "缺少参数" }, { status: 400 });
  }

  // 获取文件记录
  const file = await prisma.safetyStudyFile.findUnique({
    where: { id: fileId },
    include: { safetyStudy: true },
  });
  if (!file) {
    return NextResponse.json({ success: false, error: "文件不存在" }, { status: 404 });
  }

  // 检查目标周是否存在
  const target = await prisma.safetyStudy.findUnique({ where: { id: targetStudyId } });
  if (!target) {
    return NextResponse.json({ success: false, error: "目标周不存在" }, { status: 404 });
  }

  // 已在目标周，不操作
  if (file.safetyStudyId === targetStudyId) {
    return NextResponse.json({ success: true, data: file });
  }

  // 移动磁盘文件：从旧 study 目录移到新 study 目录
  const oldStudyDir = path.join(UPLOAD_DIR, "_safety", String(file.safetyStudy.projectId), String(file.safetyStudyId));
  const newStudyDir = path.join(UPLOAD_DIR, "_safety", String(target.projectId), String(targetStudyId));
  const newStoredPath = `_safety/${target.projectId}/${targetStudyId}/${file.originalName}`;

  if (!fs.existsSync(newStudyDir)) {
    fs.mkdirSync(newStudyDir, { recursive: true });
  }

  const oldFullPath = path.join(UPLOAD_DIR, file.storedPath);
  const newFullPath = path.join(newStudyDir, file.originalName);

  try {
    if (fs.existsSync(oldFullPath)) {
      fs.renameSync(oldFullPath, newFullPath);
    } else {
      // 旧文件不存在，只更新数据库
      console.warn("File not found on disk, updating DB only:", oldFullPath);
    }
  } catch (e) {
    // rename 跨设备可能失败，回退到 copy+unlink
    try {
      fs.copyFileSync(oldFullPath, newFullPath);
      fs.unlinkSync(oldFullPath);
    } catch (e2) {
      console.error("Failed to move file on disk:", e2);
    }
  }

  // 更新数据库记录
  const updated = await prisma.safetyStudyFile.update({
    where: { id: fileId },
    data: {
      safetyStudyId: targetStudyId,
      storedPath: newStoredPath,
    },
  });

  return NextResponse.json({ success: true, data: updated });
}
