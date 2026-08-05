// 部署后恢复：扫描 archives/ 将磁盘文件重新注册到数据库
// 与 restore_files.js 不同：不创建"恢复-"前缀的 SafetyStudy，避免被 bootstrap 清理
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

  const project = await prisma.project.findFirst({ where: { name: "三房扩2施工项目" } });
  if (!project) { console.log("Project not found"); return; }
  console.log("Project:", project.id, project.name);

  const nodes = await prisma.projectNode.findMany({ where: { projectId: project.id } });
  const nodeMap = new Map();
  for (const n of nodes) nodeMap.set(n.name, n.id);
  console.log("Nodes:", nodeMap.size);

  const dirs = fs.readdirSync(archivesDir, { withFileTypes: true });
  let fileCount = 0, safetyCount = 0, drawingCount = 0;

  for (const dir of dirs) {
    if (!dir.isDirectory()) continue;
    const dirName = dir.name;
    const dirPath = path.join(archivesDir, dirName);

    if (dirName.startsWith("_safety")) {
      safetyCount += await restoreSafetyFiles(dirPath, project.id);
    } else if (dirName.startsWith("_drawings")) {
      drawingCount += await restoreDrawingFiles(dirPath, project.id);
    } else {
      const projectNodeId = nodeMap.get(dirName) || null;
      if (dirName === "_待人工确认") {
        fileCount += await restoreNodeFiles(dirPath, "", project.id, null);
      } else if (projectNodeId) {
        fileCount += await restoreNodeFiles(dirPath, dirName, project.id, projectNodeId);
      } else {
        console.log("No matching node for:", dirName, "- skipping");
      }
    }
  }

  console.log(`\n恢复完成: ${fileCount} 个资料文件, ${safetyCount} 个安全学习文件, ${drawingCount} 个图纸`);
}

async function restoreNodeFiles(dirPath, nodeName, projectId, projectNodeId) {
  if (!fs.existsSync(dirPath)) return 0;
  const files = fs.readdirSync(dirPath, { withFileTypes: true });
  let count = 0;
  for (const f of files) {
    if (!f.isFile()) continue;
    const filePath = path.join(dirPath, f.name);
    const stat = fs.statSync(filePath);
    const relativePath = nodeName ? `${nodeName}/${f.name}` : `_待人工确认/${f.name}`;
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
  return count;
}

async function restoreSafetyFiles(safetyDir, projectId) {
  if (!fs.existsSync(safetyDir)) return 0;
  const studies = fs.readdirSync(safetyDir, { withFileTypes: true });
  let total = 0;

  for (const s of studies) {
    if (!s.isDirectory()) continue;
    const studyPath = path.join(safetyDir, s.name);
    const fileDirs = fs.readdirSync(studyPath, { withFileTypes: true });

    for (const fd of fileDirs) {
      if (!fd.isDirectory()) continue;
      const fileDirPath = path.join(studyPath, fd.name);
      const files = fs.readdirSync(fileDirPath, { withFileTypes: true });

      // 用目录中的最早文件日期作为周标签
      let minDate = null;
      const fileEntries = [];
      for (const f of files) {
        if (!f.isFile()) continue;
        const fp = path.join(fileDirPath, f.name);
        const stat = fs.statSync(fp);
        const mtime = new Date(stat.mtimeMs);
        if (!minDate || mtime < minDate) minDate = mtime;
        fileEntries.push({ name: f.name, path: fp, size: stat.size, mtime });
      }
      if (fileEntries.length === 0) continue;

      // 用文件日期计算正确周标签（如 6.15-6.21周）
      const { monday, sunday } = getWeekRange(minDate || new Date());
      const fmt = (d) => `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, "0")}`;
      const fmtISO = (d) => d.toISOString().split("T")[0];
      const weekLabel = `${fmt(monday)}-${fmt(sunday)}周`;

      // 检查是否已存在同名 SafetyStudy（避免重复）
      let study = await prisma.safetyStudy.findFirst({
        where: { projectId, weekLabel },
      });
      if (!study) {
        const weekStart = minDate ? minDate.toISOString().split("T")[0] : "2026-01-01";
        const weekEnd = new Date(minDate || "2026-01-01");
        weekEnd.setDate(weekEnd.getDate() + 6);
        study = await prisma.safetyStudy.create({
          data: { projectId, weekLabel, weekStart, weekEnd: weekEnd.toISOString().split("T")[0] },
        });
        console.log(`  +safety study: ${weekLabel}`);
      }

      for (const fe of fileEntries) {
        const existing = await prisma.safetyStudyFile.findFirst({
          where: { safetyStudyId: study.id, originalName: fe.name },
        });
        if (existing) continue;
        await prisma.safetyStudyFile.create({
          data: {
            safetyStudyId: study.id,
            originalName: fe.name,
            storedPath: `archives/_safety/${s.name}/${fd.name}/${fe.name}`,
            fileSize: fe.size,
          },
        });
        total++;
        console.log(`  +safety file: ${fe.name} -> ${weekLabel}`);
      }
    }
  }
  return total;
}

async function restoreDrawingFiles(drawingsDir, projectId) {
  if (!fs.existsSync(drawingsDir)) return 0;
  let total = 0;

  const oldProjectDirs = fs.readdirSync(drawingsDir, { withFileTypes: true });
  for (const pd of oldProjectDirs) {
    if (!pd.isDirectory()) continue;
    const pdPath = path.join(drawingsDir, pd.name);
    total += await walkDrawings(pdPath, "", projectId);
  }
  return total;
}

async function walkDrawings(dirPath, category, projectId) {
  let count = 0;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const e of entries) {
    const fullPath = path.join(dirPath, e.name);
    if (e.isDirectory()) {
      count += await walkDrawings(fullPath, category || e.name, projectId);
    } else if (e.isFile()) {
      const stat = fs.statSync(fullPath);
      const relativePath = path.relative(path.join(__dirname, "..", "archives", "_drawings"), fullPath).replace(/\\/g, "/");
      const existing = await prisma.drawing.findFirst({
        where: { projectId, storedPath: `_drawings/${relativePath}` },
      });
      if (existing) continue;
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
      count++;
      console.log(`  +drawing: ${e.name} [${cat}]`);
    }
  }
  return count;
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

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
