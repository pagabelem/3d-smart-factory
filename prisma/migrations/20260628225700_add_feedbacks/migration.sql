-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "stagiaireId" TEXT NOT NULL,
    "encadrantId" TEXT NOT NULL,
    "projetId" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vu" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_stagiaireId_fkey" FOREIGN KEY ("stagiaireId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_encadrantId_fkey" FOREIGN KEY ("encadrantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
