import { NextResponse, type NextRequest } from "next/server";

// 不需要登录就能访问的路径
const PUBLIC_PATHS = ["/login", "/api/auth"];

// 静态资源前缀（无需 cookie 检查）
const STATIC_PREFIXES = ["/_next", "/favicon", "/icon-", "/manifest", "/sw.js", "/_lan-check"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 静态资源放行
  if (STATIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 公开路径放行
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;

  // API 路由：无 token 返回 401
  if (pathname.startsWith("/api/")) {
    if (!token) {
      return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // 页面路由：无 token 重定向到登录页
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
