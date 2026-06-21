import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromCookies } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = getUserFromCookies(request.headers.get("cookie"));
  if (!user) return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
  if (!dbUser) return NextResponse.json({ success: false, error: "用户不存在" }, { status: 404 });

  return NextResponse.json({
    success: true,
    data: {
      id: dbUser.id,
      username: dbUser.username,
      displayName: dbUser.displayName,
      phone: dbUser.phone,
      role: dbUser.role,
    },
  });
}

export async function PUT(request: NextRequest) {
  const user = getUserFromCookies(request.headers.get("cookie"));
  if (!user) return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });

  const json = await request.json();
  const { displayName, phone } = json;

  await prisma.user.update({
    where: { id: user.userId },
    data: {
      ...(displayName !== undefined && { displayName: displayName || null }),
      ...(phone !== undefined && { phone: phone || null }),
    },
  });

  return NextResponse.json({ success: true, data: { displayName, phone } });
}
