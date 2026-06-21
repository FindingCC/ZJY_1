/*
  Warnings:

  - Added the required column `projectId` to the `ArchivedFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projectId` to the `ProjectNode` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Project" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ArchivedFile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectNodeId" INTEGER,
    "projectId" INTEGER NOT NULL,
    "originalName" TEXT NOT NULL,
    "storedPath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "captureDate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CLASSIFIED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ArchivedFile_projectNodeId_fkey" FOREIGN KEY ("projectNodeId") REFERENCES "ProjectNode" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ArchivedFile_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ArchivedFile" ("captureDate", "createdAt", "fileSize", "id", "originalName", "projectNodeId", "status", "storedPath") SELECT "captureDate", "createdAt", "fileSize", "id", "originalName", "projectNodeId", "status", "storedPath" FROM "ArchivedFile";
DROP TABLE "ArchivedFile";
ALTER TABLE "new_ArchivedFile" RENAME TO "ArchivedFile";
CREATE TABLE "new_ProjectNode" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "startDate" TEXT,
    "endDate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "templateId" INTEGER,
    "projectId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectNode_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ConstructionTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ProjectNode_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ProjectNode" ("createdAt", "description", "endDate", "id", "name", "order", "startDate", "status", "templateId", "updatedAt") SELECT "createdAt", "description", "endDate", "id", "name", "order", "startDate", "status", "templateId", "updatedAt" FROM "ProjectNode";
DROP TABLE "ProjectNode";
ALTER TABLE "new_ProjectNode" RENAME TO "ProjectNode";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
