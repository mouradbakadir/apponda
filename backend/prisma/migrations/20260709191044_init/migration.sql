-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'SUPERVISEUR', 'TECHNICIEN');

-- CreateEnum
CREATE TYPE "TypeMaintenance" AS ENUM ('PREVENTIVE', 'CORRECTIVE', 'MIXTE');

-- CreateEnum
CREATE TYPE "StatutMarche" AS ENUM ('BROUILLON', 'ACTIF', 'EXPIRE', 'RESILIE');

-- CreateEnum
CREATE TYPE "CategorieEquipement" AS ENUM ('ELECTRIQUE', 'MECANIQUE', 'CVC', 'INCENDIE', 'BALISAGE', 'PASSERELLE', 'ASCENSEUR', 'AUTRE');

-- CreateEnum
CREATE TYPE "Criticite" AS ENUM ('CRITIQUE', 'IMPORTANT', 'STANDARD');

-- CreateEnum
CREATE TYPE "StatutEquipement" AS ENUM ('EN_SERVICE', 'EN_PANNE', 'HORS_SERVICE', 'EN_MAINTENANCE');

-- CreateEnum
CREATE TYPE "StatutValidation" AS ENUM ('EN_ATTENTE', 'VALIDE', 'REJETE');

-- CreateEnum
CREATE TYPE "CausePanne" AS ENUM ('USURE', 'DEFAUT_ELECTRIQUE', 'DEFAUT_MECANIQUE', 'FACTEUR_EXTERNE', 'INCONNU');

-- CreateEnum
CREATE TYPE "ImpactPanne" AS ENUM ('CRITIQUE', 'MAJEUR', 'MINEUR');

-- CreateEnum
CREATE TYPE "StatutPanne" AS ENUM ('OUVERTE', 'EN_COURS', 'RESOLUE');

-- CreateEnum
CREATE TYPE "MoyenNotification" AS ENUM ('APPEL', 'EMAIL', 'SMS', 'APPLICATION');

-- CreateTable
CREATE TABLE "airports" (
    "id" TEXT NOT NULL,
    "code_iata" VARCHAR(3) NOT NULL,
    "code_oaci" VARCHAR(4) NOT NULL,
    "nom" VARCHAR(255) NOT NULL,
    "ville" VARCHAR(100) NOT NULL,
    "region" VARCHAR(100),
    "statut" VARCHAR(20) NOT NULL DEFAULT 'ACTIF',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "airports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "nom" VARCHAR(100) NOT NULL,
    "prenom" VARCHAR(100) NOT NULL,
    "role" "Role" NOT NULL,
    "airport_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marches" (
    "id" TEXT NOT NULL,
    "airport_id" TEXT NOT NULL,
    "numero_marche" VARCHAR(50) NOT NULL,
    "objet" TEXT NOT NULL,
    "type_maintenance" "TypeMaintenance" NOT NULL,
    "sla_disponibilite" DECIMAL(5,2) NOT NULL,
    "sla_prr" DECIMAL(5,2) NOT NULL,
    "sla_mrt" INTEGER NOT NULL,
    "date_debut" DATE NOT NULL,
    "date_fin" DATE NOT NULL,
    "montant_total" DECIMAL(15,2),
    "penalite_par_infraction" DECIMAL(10,2),
    "statut" "StatutMarche" NOT NULL DEFAULT 'BROUILLON',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "societes" (
    "id" TEXT NOT NULL,
    "airport_id" TEXT NOT NULL,
    "marche_id" TEXT NOT NULL,
    "raison_sociale" VARCHAR(255) NOT NULL,
    "rc_number" VARCHAR(50) NOT NULL,
    "ice" VARCHAR(15) NOT NULL,
    "adresse" TEXT NOT NULL,
    "telephone" VARCHAR(20) NOT NULL,
    "email_contact" VARCHAR(255) NOT NULL,
    "email_notification" VARCHAR(255) NOT NULL,
    "contact_urgence_nom" VARCHAR(100) NOT NULL,
    "contact_urgence_tel" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "societes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipements" (
    "id" TEXT NOT NULL,
    "airport_id" TEXT NOT NULL,
    "marche_id" TEXT NOT NULL,
    "societe_id" TEXT NOT NULL,
    "code_equipement" VARCHAR(50) NOT NULL,
    "designation" VARCHAR(255) NOT NULL,
    "categorie" "CategorieEquipement" NOT NULL,
    "localisation" VARCHAR(255) NOT NULL,
    "criticite" "Criticite" NOT NULL DEFAULT 'STANDARD',
    "date_mise_en_service" DATE,
    "heures_fonctionnement_jour" DECIMAL(4,1) NOT NULL DEFAULT 24,
    "statut" "StatutEquipement" NOT NULL DEFAULT 'EN_SERVICE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equipements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interventions_preventives" (
    "id" TEXT NOT NULL,
    "airport_id" TEXT NOT NULL,
    "equipement_id" TEXT NOT NULL,
    "mois" DATE NOT NULL,
    "nb_interventions_planifiees" INTEGER NOT NULL,
    "nb_interventions_realisees" INTEGER NOT NULL,
    "observations" TEXT,
    "saisi_par" TEXT,
    "valide_par" TEXT,
    "statut_validation" "StatutValidation" NOT NULL DEFAULT 'EN_ATTENTE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interventions_preventives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pannes" (
    "id" TEXT NOT NULL,
    "airport_id" TEXT NOT NULL,
    "equipement_id" TEXT NOT NULL,
    "t_panne" TIMESTAMP(3) NOT NULL,
    "t_reprise" TIMESTAMP(3),
    "duree_arret_minutes" INTEGER,
    "cause_panne" "CausePanne" NOT NULL,
    "description" TEXT NOT NULL,
    "actions_correctives" TEXT,
    "impact" "ImpactPanne" NOT NULL,
    "statut" "StatutPanne" NOT NULL DEFAULT 'OUVERTE',
    "saisi_par" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pannes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reclamations" (
    "id" TEXT NOT NULL,
    "airport_id" TEXT NOT NULL,
    "panne_id" TEXT NOT NULL,
    "t_notification" TIMESTAMP(3) NOT NULL,
    "moyen_notification" "MoyenNotification" NOT NULL,
    "t_arrivee" TIMESTAMP(3),
    "temps_reaction_minutes" INTEGER,
    "conforme_sla" BOOLEAN,
    "commentaire" TEXT,
    "saisi_par" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reclamations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "airport_id" TEXT,
    "action" VARCHAR(50) NOT NULL,
    "table_name" VARCHAR(50) NOT NULL,
    "record_id" TEXT,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rapports_generes" (
    "id" TEXT NOT NULL,
    "airport_id" TEXT NOT NULL,
    "type_rapport" VARCHAR(20) NOT NULL,
    "periode_debut" DATE NOT NULL,
    "periode_fin" DATE NOT NULL,
    "marche_id" TEXT,
    "societe_id" TEXT,
    "fichier_pdf_url" VARCHAR(500),
    "fichier_xlsx_url" VARCHAR(500),
    "genere_par" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rapports_generes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "airports_code_iata_key" ON "airports"("code_iata");

-- CreateIndex
CREATE UNIQUE INDEX "airports_code_oaci_key" ON "airports"("code_oaci");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "marches_airport_id_idx" ON "marches"("airport_id");

-- CreateIndex
CREATE UNIQUE INDEX "marches_airport_id_numero_marche_key" ON "marches"("airport_id", "numero_marche");

-- CreateIndex
CREATE INDEX "societes_airport_id_idx" ON "societes"("airport_id");

-- CreateIndex
CREATE INDEX "equipements_airport_id_idx" ON "equipements"("airport_id");

-- CreateIndex
CREATE INDEX "equipements_societe_id_idx" ON "equipements"("societe_id");

-- CreateIndex
CREATE UNIQUE INDEX "equipements_airport_id_code_equipement_key" ON "equipements"("airport_id", "code_equipement");

-- CreateIndex
CREATE INDEX "interventions_preventives_airport_id_mois_idx" ON "interventions_preventives"("airport_id", "mois");

-- CreateIndex
CREATE UNIQUE INDEX "interventions_preventives_airport_id_equipement_id_mois_key" ON "interventions_preventives"("airport_id", "equipement_id", "mois");

-- CreateIndex
CREATE INDEX "pannes_airport_id_t_panne_idx" ON "pannes"("airport_id", "t_panne");

-- CreateIndex
CREATE INDEX "pannes_equipement_id_idx" ON "pannes"("equipement_id");

-- CreateIndex
CREATE INDEX "reclamations_panne_id_idx" ON "reclamations"("panne_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_created_at_idx" ON "audit_logs"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_airport_id_fkey" FOREIGN KEY ("airport_id") REFERENCES "airports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marches" ADD CONSTRAINT "marches_airport_id_fkey" FOREIGN KEY ("airport_id") REFERENCES "airports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "societes" ADD CONSTRAINT "societes_airport_id_fkey" FOREIGN KEY ("airport_id") REFERENCES "airports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "societes" ADD CONSTRAINT "societes_marche_id_fkey" FOREIGN KEY ("marche_id") REFERENCES "marches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipements" ADD CONSTRAINT "equipements_airport_id_fkey" FOREIGN KEY ("airport_id") REFERENCES "airports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipements" ADD CONSTRAINT "equipements_marche_id_fkey" FOREIGN KEY ("marche_id") REFERENCES "marches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipements" ADD CONSTRAINT "equipements_societe_id_fkey" FOREIGN KEY ("societe_id") REFERENCES "societes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interventions_preventives" ADD CONSTRAINT "interventions_preventives_airport_id_fkey" FOREIGN KEY ("airport_id") REFERENCES "airports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interventions_preventives" ADD CONSTRAINT "interventions_preventives_equipement_id_fkey" FOREIGN KEY ("equipement_id") REFERENCES "equipements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interventions_preventives" ADD CONSTRAINT "interventions_preventives_saisi_par_fkey" FOREIGN KEY ("saisi_par") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interventions_preventives" ADD CONSTRAINT "interventions_preventives_valide_par_fkey" FOREIGN KEY ("valide_par") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pannes" ADD CONSTRAINT "pannes_airport_id_fkey" FOREIGN KEY ("airport_id") REFERENCES "airports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pannes" ADD CONSTRAINT "pannes_equipement_id_fkey" FOREIGN KEY ("equipement_id") REFERENCES "equipements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pannes" ADD CONSTRAINT "pannes_saisi_par_fkey" FOREIGN KEY ("saisi_par") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reclamations" ADD CONSTRAINT "reclamations_airport_id_fkey" FOREIGN KEY ("airport_id") REFERENCES "airports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reclamations" ADD CONSTRAINT "reclamations_panne_id_fkey" FOREIGN KEY ("panne_id") REFERENCES "pannes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reclamations" ADD CONSTRAINT "reclamations_saisi_par_fkey" FOREIGN KEY ("saisi_par") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_airport_id_fkey" FOREIGN KEY ("airport_id") REFERENCES "airports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapports_generes" ADD CONSTRAINT "rapports_generes_airport_id_fkey" FOREIGN KEY ("airport_id") REFERENCES "airports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapports_generes" ADD CONSTRAINT "rapports_generes_marche_id_fkey" FOREIGN KEY ("marche_id") REFERENCES "marches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapports_generes" ADD CONSTRAINT "rapports_generes_societe_id_fkey" FOREIGN KEY ("societe_id") REFERENCES "societes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapports_generes" ADD CONSTRAINT "rapports_generes_genere_par_fkey" FOREIGN KEY ("genere_par") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
