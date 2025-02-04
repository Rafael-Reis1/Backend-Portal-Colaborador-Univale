-- CreateTable
CREATE TABLE "folders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "folderName" TEXT NOT NULL,
    "forlderId" INTEGER NOT NULL,
    "cpf" TEXT NOT NULL,
    CONSTRAINT "folders_cpf_fkey" FOREIGN KEY ("cpf") REFERENCES "users" ("cpf") ON DELETE RESTRICT ON UPDATE CASCADE
);
