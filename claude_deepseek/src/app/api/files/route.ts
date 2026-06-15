import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/api";
import * as exifr from "exifr";
import * as fs from "fs";
import * as path from "path";

const ARCHIVES_DIR = path.join(process.cwd(), "archives");
const UNMATCHED_DIR = path.join(ARCHIVES_DIR, "_待人工确认");

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * 提取文件日期：优先 EXIF DateTimeOriginal，其次文件 Last-Modified
 */
async function extractCaptureDate(buffer: Buffer): Promise<string | null> {
  try {
    const exif = await exifr.parse(buffer, ["DateTimeOriginal"]);
    if (exif?.DateTimeOriginal) {
      // EXIF 格式: "2024:06:15 14:30:00" → "2024-06-15"
      return exif.DateTimeOriginal.replace(/^(\d{4}):(\d{2}):(\d{2}).*/, "$1-$2-$3");
    }
  } catch {
    // EXIF 解析失败，忽略
  }
  return null;
}

/**
 * 匹配节点：在 captureDate ∈ [startDate, endDate] 的节点中选择 startDate 最接近的
 */
function matchNode(
  captureDate: string,
  nodes: { id: number; name: string; startDate: string | null; endDate: string | null }[]
) {
  const matched = nodes
    .filter((n) => n.startDate && n.endDate && n.startDate <= captureDate && n.endDate >= captureDate)
    .sort((a, b) => (a.startDate! > b.startDate! ? 1 : -1));
  return matched[0] || null;
}

// GET /api/files — 查询归档文件列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nodeId = searchParams.get("nodeId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (nodeId) where.projectNodeId = parseInt(nodeId);
    if (status) where.status = status;

    const files = await prisma.archivedFile.findMany({
      where,
      include: {
        projectNode: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const body: ApiResponse = { success: true, data: files };
    return NextResponse.json(body);
  } catch (error) {
    const body: ApiResponse = { success: false, error: String(error) };
    return NextResponse.json(body, { status: 500 });
  }
}

// POST /api/files/import — 导入文件并自动分类
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const targetNodeId = formData.get("nodeId") as string | null;

    if (!files.length) {
      const body: ApiResponse = { success: false, error: "没有上传文件" };
      return NextResponse.json(body, { status: 400 });
    }

    // 如果指定了 nodeId，直接查该节点；否则查全部用于日期匹配
    let nodes: { id: number; name: string; startDate: string | null; endDate: string | null }[];
    if (targetNodeId) {
      const node = await prisma.projectNode.findUnique({
        where: { id: parseInt(targetNodeId) },
        select: { id: true, name: true, startDate: true, endDate: true },
      });
      nodes = node ? [node] : [];
    } else {
      nodes = await prisma.projectNode.findMany({
        select: { id: true, name: true, startDate: true, endDate: true },
      });
    }

    ensureDir(ARCHIVES_DIR);
    ensureDir(UNMATCHED_DIR);

    const results: {
      originalName: string;
      nodeName: string | null;
      captureDate: string | null;
      status: string;
      error?: string;
    }[] = [];

    for (const file of files) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const originalName = file.name;
        const fileSize = buffer.length;

        // 去重检查
        const existing = await prisma.archivedFile.findFirst({
          where: { originalName, fileSize },
        });
        if (existing) {
          results.push({ originalName, nodeName: null, captureDate: null, status: "SKIPPED", error: "文件已存在" });
          continue;
        }

        // 提取日期
        let captureDate = await extractCaptureDate(buffer);
        if (!captureDate) {
          // 回退：使用 file.lastModified
          const lm = file.lastModified;
          if (lm) {
            captureDate = new Date(lm).toISOString().split("T")[0];
          }
        }

        // 匹配节点：指定 nodeId 时直接分配，否则按日期匹配
        let matchedNode = null;
        if (targetNodeId && nodes.length === 1) {
          matchedNode = nodes[0];
        } else if (captureDate) {
          matchedNode = matchNode(captureDate, nodes);
        }

        if (matchedNode) {
          // 已分类：复制到 archives/{节点名称}/
          const nodeDir = path.join(ARCHIVES_DIR, sanitizeDirName(matchedNode.name));
          ensureDir(nodeDir);
          const storedPath = path.join(nodeDir, originalName);
          fs.writeFileSync(storedPath, buffer);

          await prisma.archivedFile.create({
            data: {
              projectNodeId: matchedNode.id,
              originalName,
              storedPath: path.relative(process.cwd(), storedPath),
              fileSize,
              captureDate,
              status: "CLASSIFIED",
            },
          });

          results.push({ originalName, nodeName: matchedNode.name, captureDate, status: "CLASSIFIED" });
        } else {
          // 未匹配：复制到 _待人工确认/
          const storedPath = path.join(UNMATCHED_DIR, originalName);
          // 避免重名
          let finalPath = storedPath;
          let counter = 1;
          const ext = path.extname(originalName);
          const base = path.basename(originalName, ext);
          while (fs.existsSync(finalPath)) {
            finalPath = path.join(UNMATCHED_DIR, `${base}_${counter}${ext}`);
            counter++;
          }
          fs.writeFileSync(finalPath, buffer);

          await prisma.archivedFile.create({
            data: {
              originalName,
              storedPath: path.relative(process.cwd(), finalPath),
              fileSize,
              captureDate,
              status: "UNMATCHED",
            },
          });

          results.push({ originalName, nodeName: null, captureDate, status: "UNMATCHED" });
        }
      } catch (err) {
        results.push({ originalName: file.name, nodeName: null, captureDate: null, status: "ERROR", error: String(err) });
      }
    }

    const body: ApiResponse = { success: true, data: { results, summary: {
      total: files.length,
      classified: results.filter((r) => r.status === "CLASSIFIED").length,
      unmatched: results.filter((r) => r.status === "UNMATCHED").length,
      skipped: results.filter((r) => r.status === "SKIPPED").length,
    } } };
    return NextResponse.json(body);
  } catch (error) {
    const body: ApiResponse = { success: false, error: String(error) };
    return NextResponse.json(body, { status: 500 });
  }
}

/** 清理文件夹名中的非法字符 */
function sanitizeDirName(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, "_").trim();
}
