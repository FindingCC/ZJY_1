import { NextResponse } from "next/server";

// 局域网检测端点：仅返回 1x1 透明像素
export async function GET() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>`;
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-store",
    },
  });
}
