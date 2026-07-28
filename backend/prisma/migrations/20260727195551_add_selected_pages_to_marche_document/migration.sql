-- AlterTable
ALTER TABLE "marche_documents" ADD COLUMN     "selected_pages" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
