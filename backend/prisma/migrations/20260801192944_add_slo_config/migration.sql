-- CreateTable
CREATE TABLE "slo_configs" (
    "id" TEXT NOT NULL,
    "airport_id" TEXT NOT NULL,
    "societe_id" TEXT NOT NULL,
    "marche_id" TEXT NOT NULL,
    "seuil_prr" DECIMAL(5,2) NOT NULL,
    "coef_prr" DECIMAL(5,2) NOT NULL,
    "seuil_mrt_heures" DECIMAL(6,3) NOT NULL,
    "coef_mrt" DECIMAL(5,2) NOT NULL,
    "seuil_dispo" DECIMAL(5,2) NOT NULL,
    "coef_dispo" DECIMAL(5,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "slo_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "slo_configs_societe_id_key" ON "slo_configs"("societe_id");

-- CreateIndex
CREATE INDEX "slo_configs_airport_id_idx" ON "slo_configs"("airport_id");

-- AddForeignKey
ALTER TABLE "slo_configs" ADD CONSTRAINT "slo_configs_airport_id_fkey" FOREIGN KEY ("airport_id") REFERENCES "airports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slo_configs" ADD CONSTRAINT "slo_configs_societe_id_fkey" FOREIGN KEY ("societe_id") REFERENCES "societes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slo_configs" ADD CONSTRAINT "slo_configs_marche_id_fkey" FOREIGN KEY ("marche_id") REFERENCES "marches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
