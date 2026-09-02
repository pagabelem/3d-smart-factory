/*
  Warnings:

  - A unique constraint covering the columns `[numeroCarteSejour]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dateDebutStage" TIMESTAMP(3),
ADD COLUMN     "dateFinStage" TIMESTAMP(3),
ADD COLUMN     "encadrantId" TEXT,
ADD COLUMN     "numeroCarteSejour" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_numeroCarteSejour_key" ON "User"("numeroCarteSejour");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_encadrantId_fkey" FOREIGN KEY ("encadrantId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
