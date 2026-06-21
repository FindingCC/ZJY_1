import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken } from "@/lib/auth";
import crypto from "crypto";

const ADMIN_PASSWORD = "Zjy@2022..";

export async function POST(request: NextRequest) {
  try {
    const { username, password, adminPassword } = await request.json();

    if (!username?.trim() || !password?.trim()) {
      return NextResponse.json({ success: false, error: "用户名和密码不能为空" }, { status: 400 });
    }

    if (username.trim().length < 2 || username.trim().length > 20) {
      return NextResponse.json({ success: false, error: "用户名长度为2-20个字符" }, { status: 400 });
    }

    if (password.length < 4) {
      return NextResponse.json({ success: false, error: "密码至少4个字符" }, { status: 400 });
    }

    // 注册需要管理员密码
    if (adminPassword !== ADMIN_PASSWORD) {
      return NextResponse.json({ success: false, error: "管理员密码错误" }, { status: 403 });
    }

    const existing = await prisma.user.findUnique({ where: { username: username.trim() } });
    if (existing) {
      return NextResponse.json({ success: false, error: "用户名已存在" }, { status: 409 });
    }

    const hashedPwd = hashPassword(password);
    const tokenId = crypto.randomUUID();
    const user = await prisma.user.create({
      data: { username: username.trim(), password: hashedPwd, role: "USER", tokenId },
    });

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
    return NextResponse.json({ success: false, error: "注册失败" }, { status: 500 });
  }
}
