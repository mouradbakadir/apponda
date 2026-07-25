-- CreateEnum
CREATE TYPE "StatutReclamation" AS ENUM ('NOUVELLE', 'EN_COURS', 'RESOLUE');

-- AlterTable
ALTER TABLE "reclamations" ADD COLUMN     "objet" VARCHAR(255),
ADD COLUMN     "statut" "StatutReclamation" NOT NULL DEFAULT 'NOUVELLE';
