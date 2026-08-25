// 服务器诊断 v2：检查所有带 storedPath 的表 + 查找真实文件位置
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

(async () => {
  const prisma = new PrismaClient();
  const cwd = process.cwd();

  async function checkTable(table, rows, nameField) {
    console.log(`\n===== 表 ${table}: ${rows.length} 条 =====`);
    let ok = 0, missing = 0;
    for (const r of rows) {
      const full = path.join(cwd, r.storedPath);
      if (fs.existsSync(full)) { ok++; continue; }
      missing++;
      console.log(`[缺失] #${r.id} | ${r[nameField]} | stored=${r.storedPath}`);
    }
    console.log(`表 ${table}: 存在=${ok} 缺失=${missing}`);
  }

  const files = await prisma.archivedFile.findMany({ orderBy: { id: "asc" } });
  await checkTable("ArchivedFile", files, "originalName");

  const drawings = await prisma.drawing.findMany({ orderBy: { id: "asc" } });
  await checkTable("Drawing", drawings, "name");

  const receipts = await prisma.receipt.findMany({ orderBy: { id: "asc" } });
  await checkTable("Receipt", receipts, "originalName");

  const safety = await prisma.safetyStudyFile.findMany({ orderBy: { id: "asc" } });
  await checkTable("SafetyStudyFile", safety, "originalName");

  // 全量扫描 archives 目录，列出所有文件
  console.log("\n===== archives/ 完整文件清单 =====");
  function walk(dir, depth) {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p, depth + 1);
      else {
        const s = fs.statSync(p);
        console.log(`${path.relative(cwd, p)} | ${s.size}`);
      }
    }
  }
  walk(path.join(cwd, "archives"), 0);

  await prisma.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
