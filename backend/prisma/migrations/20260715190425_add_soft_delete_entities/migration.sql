-- AlterTable
ALTER TABLE "equipements" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "interventions_preventives" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "marches" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "pannes" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "reclamations" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "societes" ADD COLUMN     "deleted_at" TIMESTAMP(3);
