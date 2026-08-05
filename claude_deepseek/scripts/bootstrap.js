// 启动时自动补充缺失的施工节点（只增不删，不碰已有数据）
// 以及自动补充缺失的安全学习周记录
const { PrismaClient } = require("@prisma/client");

async function seedNodes() {
  const prisma = new PrismaClient();
  try {
    const project = await prisma.project.findFirst({
      where: { name: "三房扩2施工项目" },
    });
    if (!project) {
      console.log("[bootstrap] 三房扩2施工项目 not found, skip");
      return;
    }

    const existing = await prisma.projectNode.findMany({
      where: { projectId: project.id },
    });
    const existingNames = new Set(existing.map((n) => n.name));

    const templates = await prisma.constructionTemplate.findMany({
      orderBy: { order: "asc" },
      include: { checklistItems: { orderBy: { order: "asc" } } },
    });

    const dateMap = {
      "土建施工": ["2026-06-20", "2026-08-04"],
      "设备基础及预埋件": ["2026-07-15", "2026-08-10"],
      "高压设备安装": ["2026-08-10", "2026-09-04"],
      "低压设备安装": ["2026-08-15", "2026-09-04"],
      "控制保护系统安装": ["2026-08-28", "2026-09-22"],
      "调试试验": ["2026-09-25", "2026-10-30"],
      "竣工验收": ["2026-11-01", "2026-11-15"],
    };

    let count = 0;
    for (const t of templates) {
      if (existingNames.has(t.name)) continue;
      const [start, end] = dateMap[t.name] || [null, null];
      await prisma.projectNode.create({
        data: {
          name: t.name,
          order: t.order,
          startDate: start,
          endDate: end,
          status: "PENDING",
          templateId: t.id,
          projectId: project.id,
          checklistItems: {
            create: t.checklistItems.map((ci, i) => ({
              content: ci.content,
              order: i + 1,
              isCompleted: false,
            })),
          },
        },
      });
      console.log("[bootstrap] + node:", t.name);
      count++;
    }

    if (count > 0) console.log(`[bootstrap] 新增 ${count} 个节点`);
    else console.log("[bootstrap] 所有节点已存在，无需新增");
  } finally {
    await prisma.$disconnect();
  }
}

// 自动补充缺失的安全学习周记录（只新增，不删不改）
async function extendSafetyStudies() {
  const prisma = new PrismaClient();
  try {
    const projects = await prisma.project.findMany();
    for (const project of projects) {
      // 找到该工程最晚的周记录
      const latest = await prisma.safetyStudy.findFirst({
        where: { projectId: project.id },
        orderBy: { weekEnd: "desc" },
      });
      if (!latest) continue; // 从未初始化过，跳过

      const lastEnd = new Date(latest.weekEnd);
      const now = new Date();
      let created = 0;

      // 如果最晚记录已过期，从下周一开始补充
      let cursor = new Date(lastEnd);
      cursor.setDate(cursor.getDate() + 1); // 下周一

      while (cursor <= now) {
        const { monday, sunday } = getWeekRange(cursor);
        const weekStart = fmtISO(monday);
        const weekEnd = fmtISO(sunday);

        const existing = await prisma.safetyStudy.findFirst({
          where: { projectId: project.id, weekStart },
        });
        if (!existing) {
          await prisma.safetyStudy.create({
            data: {
              projectId: project.id,
              weekLabel: `${fmt(monday)}-${fmt(sunday)}周`,
              weekStart,
              weekEnd,
            },
          });
          created++;
          console.log(`[bootstrap] + safety week: ${weekStart} for project ${project.id}`);
        }
        cursor.setDate(cursor.getDate() + 7);
      }

      if (created > 0) console.log(`[bootstrap] 自动补充 ${created} 个安全学习周记录`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

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

seedNodes()
  .then(() => extendSafetyStudies())
  .catch((e) => console.error("[bootstrap] error:", e.message));
