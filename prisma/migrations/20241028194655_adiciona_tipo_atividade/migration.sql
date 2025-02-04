/*
  Warnings:

  - Added the required column `tipoAtividade` to the `Process` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Process" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "processInstanceId" INTEGER NOT NULL,
    "processId" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "tipoAtividade" TEXT NOT NULL,
    CONSTRAINT "Process_cpf_fkey" FOREIGN KEY ("cpf") REFERENCES "users" ("cpf") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Process" ("cpf", "id", "processId", "processInstanceId") SELECT "cpf", "id", "processId", "processInstanceId" FROM "Process";
DROP TABLE "Process";
ALTER TABLE "new_Process" RENAME TO "Process";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
