const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
p.user
  .findMany({ select: { id: true, username: true, role: true, createdAt: true } })
  .then((u) => {
    console.log("local users:", JSON.stringify(u));
    return p.$disconnect();
  })
  .catch((e) => {
    console.error("ERR:", e.message);
    process.exit(1);
  });
