-- CreateEnum
CREATE TYPE "StatutExtractionDocument" AS ENUM ('EN_ATTENTE', 'EN_COURS', 'EXTRAIT', 'ECHEC');

-- CreateTable
CREATE TABLE "marche_documents" (
    "id" TEXT NOT NULL,
    "airport_id" TEXT NOT NULL,
    "marche_id" TEXT,
    "file_name" VARCHAR(255) NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "statut" "StatutExtractionDocument" NOT NULL DEFAULT 'EN_ATTENTE',
    "extracted_json" JSONB,
    "confidence_score" DECIMAL(5,2),
    "erreur_message" TEXT,
    "uploaded_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marche_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "marche_documents_airport_id_idx" ON "marche_documents"("airport_id");

-- AddForeignKey
ALTER TABLE "marche_documents" ADD CONSTRAINT "marche_documents_airport_id_fkey" FOREIGN KEY ("airport_id") REFERENCES "airports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marche_documents" ADD CONSTRAINT "marche_documents_marche_id_fkey" FOREIGN KEY ("marche_id") REFERENCES "marches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marche_documents" ADD CONSTRAINT "marche_documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
