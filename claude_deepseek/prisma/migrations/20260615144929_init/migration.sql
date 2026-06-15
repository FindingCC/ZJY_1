-- CreateTable
CREATE TABLE "ConstructionTemplate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "defaultDays" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "TemplateChecklistItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "templateId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    CONSTRAINT "TemplateChecklistItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ConstructionTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectNode" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "startDate" TEXT,
    "endDate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "templateId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectNode_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ConstructionTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChecklistItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectNodeId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    CONSTRAINT "ChecklistItem_projectNodeId_fkey" FOREIGN KEY ("projectNodeId") REFERENCES "ProjectNode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReminderLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectNodeId" INTEGER NOT NULL,
    "reminderType" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ReminderLog_projectNodeId_fkey" FOREIGN KEY ("projectNodeId") REFERENCES "ProjectNode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
