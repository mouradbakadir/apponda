-- CreateEnum
CREATE TYPE "StatutVisitePreventive" AS ENUM ('PLANIFIEE', 'REALISEE', 'ANNULEE');

-- CreateTable
CREATE TABLE "preventif_visites" (
    "id" TEXT NOT NULL,
    "airport_id" TEXT NOT NULL,
    "societe_id" TEXT NOT NULL,
    "titre" VARCHAR(255) NOT NULL,
    "date_planifiee" DATE NOT NULL,
    "date_realisee" DATE,
    "statut" "StatutVisitePreventive" NOT NULL DEFAULT 'PLANIFIEE',
    "observations" TEXT,
    "saisi_par" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "preventif_visites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "preventif_visites_airport_id_idx" ON "preventif_visites"("airport_id");

-- CreateIndex
CREATE INDEX "preventif_visites_societe_id_idx" ON "preventif_visites"("societe_id");

-- AddForeignKey
ALTER TABLE "preventif_visites" ADD CONSTRAINT "preventif_visites_airport_id_fkey" FOREIGN KEY ("airport_id") REFERENCES "airports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preventif_visites" ADD CONSTRAINT "preventif_visites_societe_id_fkey" FOREIGN KEY ("societe_id") REFERENCES "societes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preventif_visites" ADD CONSTRAINT "preventif_visites_saisi_par_fkey" FOREIGN KEY ("saisi_par") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
