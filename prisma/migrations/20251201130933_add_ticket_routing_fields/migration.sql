/*
  Warnings:

  - You are about to drop the column `assignee_user_id` on the `tickets` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_tickets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "assigned_to" TEXT NOT NULL DEFAULT 'unassigned',
    "assigned_reason" TEXT NOT NULL DEFAULT 'Pending assignment',
    "category" TEXT NOT NULL DEFAULT 'General',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "created_by_user_id" TEXT NOT NULL,
    CONSTRAINT "tickets_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_tickets" ("created_at", "created_by_user_id", "description", "id", "priority", "status", "title", "updated_at") SELECT "created_at", "created_by_user_id", "description", "id", "priority", "status", "title", "updated_at" FROM "tickets";
DROP TABLE "tickets";
ALTER TABLE "new_tickets" RENAME TO "tickets";
CREATE INDEX "idx_tickets_created_by" ON "tickets"("created_by_user_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
