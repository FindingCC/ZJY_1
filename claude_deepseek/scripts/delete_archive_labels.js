// 将「存档-YYYYMMDD」格式的安全学习周标签转为「M.dd-M.dd周」标准格式
// 只修改数据库标签，保留所有文件记录和磁盘文件
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function getWeekRange(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { monday, sunday };
}

const fmt = (d) => `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, "0")}`;
const fmtISO = (d) => d.toISOString().split("T")[0];

async function main() {
  const studies = await prisma.safetyStudy.findMany({
    where: { weekLabel: { startsWith: "存档-" } },
  });

  if (studies.length === 0) {
    console.log("没有找到「存档-」开头的记录");
    return;
  }

  for (const s of studies) {
    // 从 weekStart 日期推算正确周标签
    const d = new Date(s.weekStart);
    const { monday, sunday } = getWeekRange(d);
    const newLabel = `${fmt(monday)}-${fmt(sunday)}周`;

    // 检查同周是否已存在（避免重复）
    const exists = await prisma.safetyStudy.findFirst({
      where: { projectId: s.projectId, weekStart: fmtISO(monday) },
    });
    if (exists && exists.id !== s.id) {
      // 已有同周记录 → 把文件迁移过去，删掉这个存档记录
      await prisma.safetyStudyFile.updateMany({
        where: { safetyStudyId: s.id },
        data: { safetyStudyId: exists.id },
      });
      await prisma.safetyStudy.delete({ where: { id: s.id } });
      console.log(`已合并：${s.weekLabel} → ${newLabel}（${s._count?.files || '?'} 个文件）`);
    } else {
      // 直接重命名
      await prisma.safetyStudy.update({
        where: { id: s.id },
        data: { weekLabel: newLabel },
      });
      console.log(`已转换：${s.weekLabel} → ${newLabel}`);
    }
  }
  console.log("Done");
}

main().catch(console.error).finally(() => prisma.$disconnect());
