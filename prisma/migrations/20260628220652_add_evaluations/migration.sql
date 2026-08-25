-- CreateTable
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL,
    "note" DOUBLE PRECISION NOT NULL,
    "commentaire" TEXT,
    "stagiaireId" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "encadrantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Evaluation_stagiaireId_projetId_encadrantId_key" ON "Evaluation"("stagiaireId", "projetId", "encadrantId");

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_stagiaireId_fkey" FOREIGN KEY ("stagiaireId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_encadrantId_fkey" FOREIGN KEY ("encadrantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
