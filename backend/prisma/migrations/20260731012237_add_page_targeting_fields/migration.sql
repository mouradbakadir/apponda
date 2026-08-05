-- AlterTable
ALTER TABLE "marche_documents" ADD COLUMN     "partial_pages" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "selected_pages_auto" BOOLEAN NOT NULL DEFAULT false;
