const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const studies = await prisma.safetyStudy.findMany({
    where: { weekLabel: { startsWith: "恢复" } },
  });
  for (const s of studies) {
    // delete files first
    await prisma.safetyStudyFile.deleteMany({ where: { safetyStudyId: s.id } });
    await prisma.safetyStudy.delete({ where: { id: s.id } });
    console.log("Deleted:", s.weekLabel);
  }
  console.log("Done");
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
