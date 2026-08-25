// 恢复归档文件：将散落在 archives/施工测量及放线/ 等处的物理文件
// 复制回数据库 storedPath 记录的位置（只新增、不删除、不移动原文件）
// 用法: node scripts/_recover_archive_files.js
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();
const cwd = process.cwd();
const archivesDir = path.join(cwd, "archives");

/** 在 archives 目录下按文件名递归查找（返回全部命中） */
function findInArchives(basename) {
  const hits = [];
  (function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name === basename) hits.push(p);
    }
  })(archivesDir);
  return hits;
}

async function main() {
  const summary = { copied: 0, dbPathFixed: 0, alreadyOk: 0, problems: [] };
  let idMax = 0;

  // ── 1) 归档文件 ArchivedFile ─────────────────────────────
  const files = await prisma.archivedFile.findMany({ orderBy: { id: "asc" } });
  for (const f of files) {
    idMax = Math.max(idMax, f.id);
    const expected = path.join(cwd, f.storedPath);

    if (fs.existsSync(expected)) {
      const size = fs.statSync(expected).size;
      if (size !== f.fileSize) {
        summary.problems.push(`#${f.id} ${f.originalName}: 已存在但大小不符 DB=${f.fileSize} 磁盘=${size}`);
      } else {
        summary.alreadyOk++;
      }
      continue;
    }

    // 规范化 storedPath（确保 archives/ 前缀）
    const normalized = f.storedPath.startsWith("archives/") ? f.storedPath : `archives/${f.storedPath}`;
    const canonical = path.join(cwd, normalized);

    let src = null;
    if (fs.existsSync(canonical)) {
      src = canonical; // 文件其实就在规范化位置，只需改数据库
    } else {
      const hits = findInArchives(f.originalName);
      if (hits.length === 0) {
        summary.problems.push(`#${f.id} ${f.originalName}: 磁盘上完全找不到 (DB=${f.storedPath})`);
        continue;
      }
      // 优先大小匹配的文件
      src = hits.find((h) => fs.statSync(h).size === f.fileSize) || hits[0];
      if (hits.length > 1) {
        summary.problems.push(`#${f.id} ${f.originalName}: 找到 ${hits.length} 个同名文件，选用 ${path.relative(cwd, src)}`);
      }
    }

    const srcSize = fs.statSync(src).size;
    if (srcSize !== f.fileSize) {
      summary.problems.push(`#${f.id} ${f.originalName}: 源文件大小不符 DB=${f.fileSize} 源=${srcSize} (${path.relative(cwd, src)}) — 未复制`);
      continue;
    }

    // 复制到规范化位置
    fs.mkdirSync(path.dirname(canonical), { recursive: true });
    fs.copyFileSync(src, canonical);

    // 数据库路径规范化（仅当原本缺 archives/ 前缀时更新）
    if (normalized !== f.storedPath) {
      await prisma.archivedFile.update({ where: { id: f.id }, data: { storedPath: normalized } });
      summary.dbPathFixed++;
    } else {
      summary.copied++;
    }
    console.log(`+ #${f.id} ${f.originalName} -> ${normalized} (${srcSize} B)`);
  }

  // ── 2) 安全学习文件 SafetyStudyFile ──────────────────────
  const safetyFiles = await prisma.safetyStudyFile.findMany({ orderBy: { id: "asc" } });
  for (const s of safetyFiles) {
    const expected = path.join(cwd, s.storedPath);
    if (fs.existsSync(expected)) {
      const size = fs.statSync(expected).size;
      if (size !== s.fileSize) {
        summary.problems.push(`安全#${s.id} ${s.originalName}: 已存在但大小不符 DB=${s.fileSize} 磁盘=${size}`);
      } else {
        summary.alreadyOk++;
      }
      continue;
    }
    const hits = findInArchives(s.originalName);
    if (hits.length === 0) {
      summary.problems.push(`安全#${s.id} ${s.originalName}: 磁盘上完全找不到 (DB=${s.storedPath})`);
      continue;
    }
    const src = hits.find((h) => fs.statSync(h).size === s.fileSize) || hits[0];
    const srcSize = fs.statSync(src).size;
    if (srcSize !== s.fileSize) {
      summary.problems.push(`安全#${s.id} ${s.originalName}: 源文件大小不符 DB=${s.fileSize} 源=${srcSize} — 未复制`);
      continue;
    }
    fs.mkdirSync(path.dirname(expected), { recursive: true });
    fs.copyFileSync(src, expected);
    summary.copied++;
    console.log(`+ 安全#${s.id} ${s.originalName} -> ${s.storedPath} (${srcSize} B)`);
  }

  // ── 3) 图纸/收货单（也顺带校验） ─────────────────────────
  for (const table of ["drawing", "receipt"]) {
    const rows = await prisma[table].findMany();
    for (const r of rows) {
      const expected = path.join(cwd, r.storedPath);
      if (!fs.existsSync(expected)) {
        summary.problems.push(`${table}#${r.id} ${r.originalName || r.name}: 磁盘缺失 (${r.storedPath})`);
      } else if (fs.statSync(expected).size !== r.fileSize) {
        summary.problems.push(`${table}#${r.id} ${r.originalName || r.name}: 大小不符`);
      } else {
        summary.alreadyOk++;
      }
    }
  }

  console.log("\n===== 汇总 =====");
  console.log(JSON.stringify(summary, null, 2));
  if (summary.problems.length > 0) {
    console.log("\n存在未解决/需注意的问题:");
    for (const p of summary.problems) console.log("  - " + p);
    process.exitCode = 2;
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
