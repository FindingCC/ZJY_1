import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/api";

// GET /api/templates — 获取所有施工节点模板
export async function GET() {
  try {
    const templates = await prisma.constructionTemplate.findMany({
      include: {
        checklistItems: { orderBy: { order: "asc" } },
      },
      orderBy: { order: "asc" },
    });
    const body: ApiResponse = { success: true, data: templates };
    return NextResponse.json(body);
  } catch (error) {
    const body: ApiResponse = { success: false, error: String(error) };
    return NextResponse.json(body, { status: 500 });
  }
}
