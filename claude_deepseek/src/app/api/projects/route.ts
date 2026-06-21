import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 创建工程密码
const CREATE_PASSWORD = "Zjy@2022..";

// GET /api/projects — 列出所有工程
export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: projects });
  } catch (error) {
    return NextResponse.json({ success: false, error: "获取工程列表失败" }, { status: 500 });
  }
}

// POST /api/projects — 新建工程（需密码）
export async function POST(request: NextRequest) {
  try {
    const { name, password } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: "工程名称不能为空" }, { status: 400 });
    }

    if (password !== CREATE_PASSWORD) {
      return NextResponse.json({ success: false, error: "密码错误" }, { status: 403 });
    }

    const project = await prisma.project.create({
      data: { name: name.trim() },
    });

    return NextResponse.json({ success: true, data: project });
  } catch (error) {
    return NextResponse.json({ success: false, error: "创建工程失败" }, { status: 500 });
  }
}
