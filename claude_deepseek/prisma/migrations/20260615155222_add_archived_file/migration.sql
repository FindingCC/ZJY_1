-- CreateTable
CREATE TABLE "ArchivedFile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectNodeId" INTEGER,
    "originalName" TEXT NOT NULL,
    "storedPath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "captureDate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CLASSIFIED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ArchivedFile_projectNodeId_fkey" FOREIGN KEY ("projectNodeId") REFERENCES "ProjectNode" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
