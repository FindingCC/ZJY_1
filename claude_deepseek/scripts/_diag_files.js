// 诊断归档文件：检查数据库记录与磁盘文件是否一致
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

(async () => {
  const prisma = new PrismaClient();
  const files = await prisma.archivedFile.findMany({ orderBy: { id: "asc" } });
  console.log("archivedFile 总数:", files.length);

  const counts = { exist: 0, missing: 0, zero: 0 };
  for (const f of files) {
    const full = path.join(process.cwd(), f.storedPath);
    let info = "";
    if (fs.existsSync(full)) {
      const size = fs.statSync(full).size;
      counts.exist++;
      if (size === 0) { counts.zero++; info = " [0字节!]"; }
      info += " size=" + size;
    } else {
      counts.missing++;
      info = " [文件缺失!]";
    }
    console.log(`#${f.id} | ${f.originalName} | ${f.status} | stored=${f.storedPath} | ${info}`);
  }
  console.log("汇总:", JSON.stringify(counts));

  // 其他表统计
  const tables = ["Project", "ProjectNode", "Drawing", "Receipt", "SafetyStudyFile", "SafetyStudy"];
  for (const t of tables) {
    try {
      const n = await prisma[t].count();
      console.log(`表 ${t}: ${n}`);
    } catch (e) { console.log(`表 ${t}: 查询失败 ${e.message}`); }
  }
  await prisma.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
