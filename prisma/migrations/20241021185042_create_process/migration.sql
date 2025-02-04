-- CreateTable
CREATE TABLE "Process" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "processInstanceId" INTEGER NOT NULL,
    "processId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Process_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
