-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ReminderLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectNodeId" INTEGER,
    "reminderType" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ReminderLog_projectNodeId_fkey" FOREIGN KEY ("projectNodeId") REFERENCES "ProjectNode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ReminderLog" ("id", "isRead", "projectNodeId", "reminderType", "sentAt") SELECT "id", "isRead", "projectNodeId", "reminderType", "sentAt" FROM "ReminderLog";
DROP TABLE "ReminderLog";
ALTER TABLE "new_ReminderLog" RENAME TO "ReminderLog";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
