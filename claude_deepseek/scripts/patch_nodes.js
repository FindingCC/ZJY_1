const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.findFirst({ where: { name: "三房扩2施工项目" } });
  if (!project) { console.log("Project not found"); return; }

  const existing = await prisma.projectNode.findMany({ where: { projectId: project.id } });
  const existingNames = new Set(existing.map(n => n.name));
  console.log("已有节点 (" + existing.length + " 个):", [...existingNames].join(", "));

  const templates = await prisma.constructionTemplate.findMany({
    orderBy: { order: "asc" },
    include: { checklistItems: { orderBy: { order: "asc" } } },
  });

  const dateMap = {
    "土建施工": "2026-06-20|2026-08-04",
    "设备基础及预埋件": "2026-07-15|2026-08-10",
    "高压设备安装": "2026-08-10|2026-09-04",
    "低压设备安装": "2026-08-15|2026-09-04",
    "控制保护系统安装": "2026-08-28|2026-09-22",
    "调试试验": "2026-09-25|2026-10-30",
    "竣工验收": "2026-11-01|2026-11-15",
  };

  let created = 0;
  for (const t of templates) {
    if (existingNames.has(t.name)) continue;
    const ds = dateMap[t.name];
    const [start, end] = ds ? ds.split("|") : [null, null];

    const node = await prisma.projectNode.create({
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
    console.log("✓ 新增节点 #" + node.id + " " + node.name);
    created++;
  }

  console.log("\n完成！新增 " + created + " 个节点");
  if (created === 0) console.log("所有节点已存在，无需新增");
}

main().catch(console.error).finally(() => prisma.$disconnect());
