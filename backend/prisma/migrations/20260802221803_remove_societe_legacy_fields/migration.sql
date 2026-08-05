/*
  Warnings:

  - You are about to drop the column `adresse` on the `societes` table. All the data in the column will be lost.
  - You are about to drop the column `contact_urgence_nom` on the `societes` table. All the data in the column will be lost.
  - You are about to drop the column `contact_urgence_tel` on the `societes` table. All the data in the column will be lost.
  - You are about to drop the column `email_notification` on the `societes` table. All the data in the column will be lost.
  - You are about to drop the column `ice` on the `societes` table. All the data in the column will be lost.
  - You are about to drop the column `rc_number` on the `societes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "societes" DROP COLUMN "adresse",
DROP COLUMN "contact_urgence_nom",
DROP COLUMN "contact_urgence_tel",
DROP COLUMN "email_notification",
DROP COLUMN "ice",
DROP COLUMN "rc_number",
ALTER COLUMN "telephone" DROP NOT NULL,
ALTER COLUMN "email_contact" DROP NOT NULL;
