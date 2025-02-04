/*
  Warnings:

  - You are about to drop the column `parentId` on the `folders` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_folders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "folderName" TEXT NOT NULL,
    "forlderId" INTEGER NOT NULL,
    "cpf" TEXT NOT NULL,
    CONSTRAINT "folders_cpf_fkey" FOREIGN KEY ("cpf") REFERENCES "users" ("cpf") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_folders" ("cpf", "folderName", "forlderId", "id") SELECT "cpf", "folderName", "forlderId", "id" FROM "folders";
DROP TABLE "folders";
ALTER TABLE "new_folders" RENAME TO "folders";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
