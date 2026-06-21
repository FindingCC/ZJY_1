import { NextRequest, NextResponse } from "next/server";
import { getUserFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromCookies(request.headers.get("cookie"));
    if (!user) {
      return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser) {
      return NextResponse.json({ success: false, error: "用户不存在" }, { status: 401 });
    }

    // 被踢下线检测
    if (dbUser.tokenId && dbUser.tokenId !== user.tokenId) {
      const response = NextResponse.json({ success: false, error: "你的账号已在其他设备登录，你已被踢下线", kicked: true }, { status: 401 });
      response.cookies.set("token", "", { httpOnly: true, maxAge: 0, path: "/" });
      return response;
    }

    return NextResponse.json({
      success: true,
      data: { id: dbUser.id, username: dbUser.username, role: dbUser.role },
    });
  } catch {
    return NextResponse.json({ success: false, error: "认证失败" }, { status: 500 });
  }
}

export async function POST() {
  // 退出登录：清除 cookie
  const response = NextResponse.json({ success: true, data: null });
  response.cookies.set("token", "", { httpOnly: true, maxAge: 0, path: "/" });
  return response;
}
