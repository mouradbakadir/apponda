-- CreateTable
CREATE TABLE "societe_membres" (
    "id" TEXT NOT NULL,
    "societe_id" TEXT NOT NULL,
    "role" VARCHAR(50) NOT NULL,
    "nom" VARCHAR(150) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "telephone" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "societe_membres_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "societe_membres_societe_id_idx" ON "societe_membres"("societe_id");

-- AddForeignKey
ALTER TABLE "societe_membres" ADD CONSTRAINT "societe_membres_societe_id_fkey" FOREIGN KEY ("societe_id") REFERENCES "societes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
