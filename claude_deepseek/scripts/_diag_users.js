const { PrismaClient } = require("@prisma/client");
const fs = require("fs");

(async () => {
  // 1) 实际 User 表结构
  const p = new PrismaClient();
  const cols = await p.$queryRawUnsafe("PRAGMA table_info(User)");
  console.log("=== 实际 User 表结构 ===");
  console.log(JSON.stringify(cols.map((c) => ({ name: c.name, type: c.type }))));

  // 2) 用户列表
  const users = await p.user.findMany({ select: { id: true, username: true, role: true, createdAt: true } });
  console.log("=== 用户 ===");
  console.log(JSON.stringify(users));

  // 3) 尝试按登录流程查用户
  try {
    const u = await p.user.findUnique({ where: { username: "18507092279" } });
    console.log("=== findUnique 18507092279 ===");
    console.log(u ? `找到 id=${u.id} role=${u.role} hash前缀=${u.password.slice(0, 20)}` : "未找到");
  } catch (e) {
    console.log("=== findUnique 抛错 ===");
    console.log(e.message);
  }
  await p.$disconnect();
})().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
