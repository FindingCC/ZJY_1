import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, error: "用户名和密码不能为空" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return NextResponse.json({ success: false, error: "用户名或密码错误" }, { status: 401 });
    }

    if (!verifyPassword(password, user.password)) {
      return NextResponse.json({ success: false, error: "用户名或密码错误" }, { status: 401 });
    }

    const token = signToken({ userId: user.id, username: user.username, role: user.role });

    const response = NextResponse.json({
      success: true,
      data: { id: user.id, username: user.username, role: user.role, token },
    });

    // 设置 httpOnly cookie
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7天
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ success: false, error: "登录失败" }, { status: 500 });
  }
}
