// 恢复磁盘上的文件到数据库
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  const archivesDir = path.join(__dirname, "..", "archives");
  if (!fs.existsSync(archivesDir)) {
    console.log("No archives directory found");
    return;
  }

  // 找工程和节点
  const project = await prisma.project.findFirst({ where: { name: "三房扩2施工项目" } });
  if (!project) { console.log("Project not found"); return; }
  console.log("Project:", project.id, project.name);

  const nodes = await prisma.projectNode.findMany({ where: { projectId: project.id } });
  const nodeMap = new Map();
  for (const n of nodes) nodeMap.set(n.name, n.id);
  console.log("Nodes:", [...nodeMap.entries()]);

  const dirs = fs.readdirSync(archivesDir, { withFileTypes: true });
  let restored = 0;

  for (const dir of dirs) {
    if (!dir.isDirectory()) continue;
    const dirName = dir.name;
    const dirPath = path.join(archivesDir, dirName);

    // 跳过特殊目录
    if (dirName.startsWith("_safety") || dirName.startsWith("_drawings")) continue;

    const projectNodeId = nodeMap.get(dirName) || null;
    if (dirName === "_待人工确认") {
      await restoreNodeFiles(dirPath, "", project.id, null);
    } else if (projectNodeId) {
      await restoreNodeFiles(dirPath, dirName, project.id, projectNodeId);
    } else {
      console.log("No matching node for:", dirName, "- skipping");
    }
  }

  // 恢复 safety 文件
  await restoreSafetyFiles(archivesDir, project.id);

  // 恢复 drawings 文件
  await restoreDrawingFiles(archivesDir, project.id);

  console.log("Done!");
}

async function restoreNodeFiles(dirPath, nodeName, projectId, projectNodeId) {
  if (!fs.existsSync(dirPath)) return;
  const files = fs.readdirSync(dirPath, { withFileTypes: true });
  let count = 0;
  for (const f of files) {
    if (!f.isFile()) continue;
    const filePath = path.join(dirPath, f.name);
    const stat = fs.statSync(filePath);
    const relativePath = nodeName ? `${nodeName}/${f.name}` : `_待人工确认/${f.name}`;

    // 检查是否已存在
    const existing = await prisma.archivedFile.findFirst({ where: { storedPath: relativePath, projectId } });
    if (existing) continue;

    await prisma.archivedFile.create({
      data: {
        originalName: f.name,
        storedPath: relativePath,
        fileSize: stat.size,
        projectId,
        projectNodeId,
        status: "CLASSIFIED",
      },
    });
    count++;
  }
  if (count > 0) console.log(`  +${count} files in "${nodeName || "_待人工确认"}"`);
}

async function restoreSafetyFiles(archivesDir, projectId) {
  const safetyDir = path.join(archivesDir, "_safety");
  if (!fs.existsSync(safetyDir)) return;

  // 遍历 _safety/{studyId}/{fileId}/ 结构
  const studies = fs.readdirSync(safetyDir, { withFileTypes: true });
  for (const s of studies) {
    if (!s.isDirectory()) continue;
    const studyPath = path.join(safetyDir, s.name);
    const fileDirs = fs.readdirSync(studyPath, { withFileTypes: true });
    for (const fd of fileDirs) {
      if (!fd.isDirectory()) continue;
      const fileDirPath = path.join(studyPath, fd.name);
      const files = fs.readdirSync(fileDirPath, { withFileTypes: true });
      for (const f of files) {
        if (!f.isFile()) continue;
        // 创建 SafetyStudy 记录（如果还没有）
        let study = await prisma.safetyStudy.findFirst({ where: { projectId, weekLabel: `_recovered_${s.name}` } });
        if (!study) {
          study = await prisma.safetyStudy.create({
            data: { projectId, weekLabel: `恢复-${s.name}`, weekStart: "2026-01-01", weekEnd: "2026-12-31" },
          });
        }
        const fp = path.join(fileDirPath, f.name);
        const stat = fs.statSync(fp);
        const existing = await prisma.safetyStudyFile.findFirst({
          where: { safetyStudyId: study.id, originalName: f.name },
        });
        if (existing) continue;
        await prisma.safetyStudyFile.create({
          data: {
            safetyStudyId: study.id,
            originalName: f.name,
            storedPath: `_safety/${s.name}/${fd.name}/${f.name}`,
            fileSize: stat.size,
          },
        });
        console.log(`  +safety: ${f.name}`);
      }
    }
  }
}

async function restoreDrawingFiles(archivesDir, projectId) {
  const drawingsDir = path.join(archivesDir, "_drawings");
  if (!fs.existsSync(drawingsDir)) return;

  // _drawings/{projectId}/category/subCategory/file
  const oldProjectDirs = fs.readdirSync(drawingsDir, { withFileTypes: true });
  for (const pd of oldProjectDirs) {
    if (!pd.isDirectory()) continue;
    const pdPath = path.join(drawingsDir, pd.name);
    await walkDrawings(pdPath, "", projectId);
  }
}

async function walkDrawings(dirPath, category, projectId) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const e of entries) {
    const fullPath = path.join(dirPath, e.name);
    if (e.isDirectory()) {
      // 如果当前没有 category，这是第一层目录 = category
      // 如果有 category，这是 subCategory
      await walkDrawings(fullPath, category || e.name, projectId);
    } else if (e.isFile()) {
      const stat = fs.statSync(fullPath);
      const relativePath = path.relative(path.join(__dirname, "..", "archives", "_drawings"), fullPath).replace(/\\/g, "/");
      const existing = await prisma.drawing.findFirst({
        where: { projectId, storedPath: `_drawings/${relativePath}` },
      });
      if (existing) continue;

      // 从路径推断 category 和 subCategory
      // relativePath 格式: 1/电气一次/file.pdf 或 1/电气一次/电容器部分/file.pdf
      const parts = relativePath.split("/");
      const cat = parts.length >= 2 ? parts[1] : "未分类";
      const subCat = parts.length >= 3 && parts[2] !== e.name ? parts[2] : "";

      await prisma.drawing.create({
        data: {
          projectId,
          category: cat,
          subCategory: subCat,
          name: e.name,
          storedPath: `_drawings/${relativePath}`,
          fileSize: stat.size,
        },
      });
      console.log(`  +drawing: ${e.name} [${cat}]`);
    }
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
