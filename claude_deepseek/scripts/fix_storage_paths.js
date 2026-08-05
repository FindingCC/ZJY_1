// 修复 storagePath：给 safety 和 drawing 文件补上 archives/ 前缀
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // 修复安全学习文件路径
  const safetyFiles = await prisma.safetyStudyFile.findMany({
    where: { storedPath: { startsWith: "_safety/" } },
  });
  console.log(`Safety files to fix: ${safetyFiles.length}`);
  for (const f of safetyFiles) {
    await prisma.safetyStudyFile.update({
      where: { id: f.id },
      data: { storedPath: `archives/${f.storedPath}` },
    });
  }

  // 修复图纸文件路径
  const drawings = await prisma.drawing.findMany({
    where: { storedPath: { startsWith: "_drawings/" } },
  });
  console.log(`Drawings to fix: ${drawings.length}`);
  for (const d of drawings) {
    await prisma.drawing.update({
      where: { id: d.id },
      data: { storedPath: `archives/${d.storedPath}` },
    });
  }

  console.log("Done");
}

main().catch(console.error).finally(() => prisma.$disconnect());
