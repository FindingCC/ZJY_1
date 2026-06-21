import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken } from "@/lib/auth";
import crypto from "crypto";

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

    // 生成新的 tokenId，踢掉旧设备
    const tokenId = crypto.randomUUID();
    await prisma.user.update({ where: { id: user.id }, data: { tokenId } });

    const token = signToken({ userId: user.id, username: user.username, role: user.role, tokenId });

    const response = NextResponse.json({
      success: true,
      data: { id: user.id, username: user.username, role: user.role, token },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ success: false, error: "登录失败" }, { status: 500 });
  }
}
