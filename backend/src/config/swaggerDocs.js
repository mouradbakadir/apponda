/**
 * @swagger
 * components:
 *   parameters:
 *     IdParam:
 *       in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: string
 *       description: ID de l'entité (UUID)
 *   schemas:
 *
 *     CreateMarche:
 *       type: object
 *       required: [numeroMarche, objet, typeMaintenance, slaDisponibilite, slaPrr, slaMrt, dateDebut, dateFin]
 *       properties:
 *         numeroMarche:
 *           type: string
 *           example: "MCH-2026-099"
 *         objet:
 *           type: string
 *           example: "Maintenance des équipements CVC"
 *         typeMaintenance:
 *           type: string
 *           enum: [PREVENTIVE, CORRECTIVE, MIXTE]
 *           example: "PREVENTIVE"
 *         slaDisponibilite:
 *           type: number
 *           example: 98
 *         slaPrr:
 *           type: number
 *           example: 95
 *         slaMrt:
 *           type: number
 *           example: 45
 *         dateDebut:
 *           type: string
 *           example: "2026-01-01"
 *         dateFin:
 *           type: string
 *           example: "2026-12-31"
 *         montantTotal:
 *           type: number
 *           example: 500000
 *         penaliteParInfraction:
 *           type: number
 *           example: 5000
 *
 *     CreateSociete:
 *       type: object
 *       required: [marcheId, raisonSociale, rcNumber, ice, adresse, telephone, emailContact, emailNotification, contactUrgenceNom, contactUrgenceTel]
 *       properties:
 *         marcheId:
 *           type: string
 *           example: "d101e131-d3c0-4420-9292-5782c511152d"
 *         raisonSociale:
 *           type: string
 *           example: "SODETEC MAROC"
 *         rcNumber:
 *           type: string
 *           example: "RC-123456"
 *         ice:
 *           type: string
 *           example: "001234567000012"
 *         adresse:
 *           type: string
 *           example: "Zone Industrielle, Casablanca"
 *         telephone:
 *           type: string
 *           example: "0522-123456"
 *         emailContact:
 *           type: string
 *           example: "contact@sodetec.ma"
 *         emailNotification:
 *           type: string
 *           example: "notif@sodetec.ma"
 *         contactUrgenceNom:
 *           type: string
 *           example: "Mohammed Alami"
 *         contactUrgenceTel:
 *           type: string
 *           example: "0661-123456"
 *
 *     CreateEquipement:
 *       type: object
 *       required: [marcheId, societeId, codeEquipement, designation, categorie, localisation]
 *       properties:
 *         marcheId:
 *           type: string
 *           example: "d101e131-d3c0-4420-9292-5782c511152d"
 *         societeId:
 *           type: string
 *           example: "COLLE-ICI-UUID-SOCIETE"
 *         codeEquipement:
 *           type: string
 *           example: "EQ-CVC-001"
 *         designation:
 *           type: string
 *           example: "Climatiseur Hall Départ"
 *         categorie:
 *           type: string
 *           enum: [ELECTRIQUE, MECANIQUE, CVC, INCENDIE, BALISAGE, PASSERELLE, ASCENSEUR, AUTRE]
 *           example: "CVC"
 *         localisation:
 *           type: string
 *           example: "Hall Départ - Niveau 1"
 *         criticite:
 *           type: string
 *           enum: [CRITIQUE, IMPORTANT, STANDARD]
 *           example: "IMPORTANT"
 *         dateMiseEnService:
 *           type: string
 *           example: "2023-01-01"
 *         heuresFonctionnementJour:
 *           type: number
 *           example: 16
 *
 *     CreatePanne:
 *       type: object
 *       required: [equipementId, tPanne, causePanne, description, impact]
 *       properties:
 *         equipementId:
 *           type: string
 *           example: "COLLE-ICI-UUID-EQUIPEMENT"
 *         tPanne:
 *           type: string
 *           example: "2026-06-15T10:00:00.000Z"
 *         tReprise:
 *           type: string
 *           example: "2026-06-15T12:00:00.000Z"
 *         causePanne:
 *           type: string
 *           enum: [USURE, DEFAUT_ELECTRIQUE, DEFAUT_MECANIQUE, FACTEUR_EXTERNE, INCONNU]
 *           example: "DEFAUT_ELECTRIQUE"
 *         description:
 *           type: string
 *           example: "Panne de test pour audit KPI"
 *         actionsCorrectives:
 *           type: string
 *           example: "Remplacement du fusible"
 *         impact:
 *           type: string
 *           enum: [CRITIQUE, MAJEUR, MINEUR]
 *           example: "MINEUR"
 *
 *     ClosePanne:
 *       type: object
 *       required: [tReprise]
 *       properties:
 *         tReprise:
 *           type: string
 *           example: "2026-06-15T12:00:00.000Z"
 *         actionsCorrectives:
 *           type: string
 *           example: "Remplacement du fusible"
 *
 *     CreateReclamation:
 *       type: object
 *       required: [panneId, tNotification, moyenNotification]
 *       properties:
 *         panneId:
 *           type: string
 *           example: "COLLE-ICI-UUID-PANNE"
 *         tNotification:
 *           type: string
 *           example: "2026-06-15T10:05:00.000Z"
 *         moyenNotification:
 *           type: string
 *           enum: [APPEL, EMAIL, SMS, APPLICATION]
 *           example: "APPLICATION"
 *         tArrivee:
 *           type: string
 *           example: "2026-06-15T10:25:00.000Z"
 *         commentaire:
 *           type: string
 *           example: "Intervention urgente requise"
 *
 *     CreatePreventif:
 *       type: object
 *       required: [equipementId, mois, nbInterventionsPlanifiees, nbInterventionsRealisees]
 *       properties:
 *         equipementId:
 *           type: string
 *           example: "COLLE-ICI-UUID-EQUIPEMENT"
 *         mois:
 *           type: string
 *           example: "2026-06-01"
 *         nbInterventionsPlanifiees:
 *           type: integer
 *           example: 4
 *         nbInterventionsRealisees:
 *           type: integer
 *           example: 3
 *         observations:
 *           type: string
 *           example: "Une intervention reportée au mois suivant"
 *
 *     CreateUser:
 *       type: object
 *       required: [email, password, nom, prenom, role]
 *       properties:
 *         email:
 *           type: string
 *           example: "test.securite@onda.ma"
 *         password:
 *           type: string
 *           example: "TestSecurite123!"
 *         nom:
 *           type: string
 *           example: "Test"
 *         prenom:
 *           type: string
 *           example: "Securite"
 *         role:
 *           type: string
 *           enum: [SUPER_ADMIN, SUPERVISEUR, TECHNICIEN]
 *           example: "TECHNICIEN"
 *         airportId:
 *           type: string
 *           description: Obligatoire pour SUPERVISEUR et TECHNICIEN
 *           example: "96e0dd1b-c62a-4652-abc9-d4e31c438ba7"
 *
 * tags:
 *   - name: Marches
 *     description: Gestion des marchés ONDA
 *   - name: Societes
 *     description: Entreprises prestataires
 *   - name: Equipements
 *     description: Équipements de l'aéroport
 *   - name: Pannes
 *     description: Suivi des pannes
 *   - name: Reclamations
 *     description: Réclamations et suivi SLA
 *   - name: Preventif
 *     description: Interventions préventives
 *   - name: Users
 *     description: Gestion des utilisateurs (Super Admin)
 *   - name: KPI
 *     description: Statistiques et Performances (PRR, MRT, Disponibilité)
 *
 * /api/kpi/marche/{marcheId}:
 *   get:
 *     summary: Calculer les KPIs d'un marché
 *     tags: [KPI]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: marcheId
 *         required: true
 *         schema: { type: string }
 *         description: L'ID du marché
 *       - in: query
 *         name: dateDebut
 *         required: true
 *         schema: { type: string }
 *         description: Date de début (ex 2026-01-01)
 *       - in: query
 *         name: dateFin
 *         required: true
 *         schema: { type: string }
 *         description: Date de fin (ex 2026-12-31)
 *     responses: { 200: { description: Statistiques générées } }
 *
 * /api/kpi/marche/{marcheId}/generate-pdf:
 *   post:
 *     summary: Générer le rapport KPI en PDF (Asynchrone)
 *     tags: [KPI]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: marcheId
 *         required: true
 *         schema: { type: string }
 *     responses: { 202: { description: Génération lancée en arrière-plan } }
 *
 * /api/marches:
 *   get:
 *     summary: Liste paginée des marchés
 *     tags: [Marches]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Succès } }
 *   post:
 *     summary: Créer un marché
 *     tags: [Marches]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateMarche' }
 *     responses: { 201: { description: Marché créé } }
 *
 * /api/marches/{id}:
 *   parameters:
 *     - $ref: '#/components/parameters/IdParam'
 *   get:
 *     summary: Détail d'un marché
 *     tags: [Marches]
 *     security: [{ bearerAuth: [] }]
 *   patch:
 *     summary: Modifier un marché
 *     tags: [Marches]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateMarche' }
 *   delete:
 *     summary: Supprimer un marché (Soft Delete)
 *     tags: [Marches]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 204: { description: Supprimé } }
 *
 * /api/societes:
 *   get:
 *     summary: Liste paginée des sociétés
 *     tags: [Societes]
 *     security: [{ bearerAuth: [] }]
 *   post:
 *     summary: Créer une société
 *     tags: [Societes]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateSociete' }
 *     responses: { 201: { description: Société créée } }
 *
 * /api/societes/{id}:
 *   parameters:
 *     - $ref: '#/components/parameters/IdParam'
 *   get:
 *     summary: Détail d'une société
 *     tags: [Societes]
 *     security: [{ bearerAuth: [] }]
 *   patch:
 *     summary: Modifier une société
 *     tags: [Societes]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateSociete' }
 *   delete:
 *     summary: Supprimer une société (Soft Delete)
 *     tags: [Societes]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 204: { description: Supprimé } }
 *
 * /api/equipements:
 *   get:
 *     summary: Liste paginée des équipements
 *     tags: [Equipements]
 *     security: [{ bearerAuth: [] }]
 *   post:
 *     summary: Créer un équipement
 *     tags: [Equipements]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateEquipement' }
 *     responses: { 201: { description: Équipement créé } }
 *
 * /api/equipements/{id}:
 *   parameters:
 *     - $ref: '#/components/parameters/IdParam'
 *   get:
 *     summary: Détail d'un équipement
 *     tags: [Equipements]
 *     security: [{ bearerAuth: [] }]
 *   patch:
 *     summary: Modifier un équipement
 *     tags: [Equipements]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateEquipement' }
 *   delete:
 *     summary: Supprimer un équipement (Soft Delete)
 *     tags: [Equipements]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 204: { description: Supprimé } }
 *
 * /api/pannes:
 *   get:
 *     summary: Liste paginée des pannes
 *     tags: [Pannes]
 *     security: [{ bearerAuth: [] }]
 *   post:
 *     summary: Déclarer une panne
 *     tags: [Pannes]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreatePanne' }
 *     responses: { 201: { description: Panne créée } }
 *
 * /api/pannes/{id}:
 *   parameters:
 *     - $ref: '#/components/parameters/IdParam'
 *   get:
 *     summary: Détail d'une panne
 *     tags: [Pannes]
 *     security: [{ bearerAuth: [] }]
 *   delete:
 *     summary: Supprimer une panne (Soft Delete)
 *     tags: [Pannes]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 204: { description: Supprimé } }
 *
 * /api/pannes/{id}/close:
 *   parameters:
 *     - $ref: '#/components/parameters/IdParam'
 *   patch:
 *     summary: Clôturer une panne
 *     tags: [Pannes]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ClosePanne' }
 *
 * /api/reclamations:
 *   get:
 *     summary: Liste paginée des réclamations
 *     tags: [Reclamations]
 *     security: [{ bearerAuth: [] }]
 *   post:
 *     summary: Saisir une réclamation
 *     tags: [Reclamations]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateReclamation' }
 *     responses: { 201: { description: Réclamation créée } }
 *
 * /api/reclamations/{id}:
 *   parameters:
 *     - $ref: '#/components/parameters/IdParam'
 *   get:
 *     summary: Détail d'une réclamation
 *     tags: [Reclamations]
 *     security: [{ bearerAuth: [] }]
 *   delete:
 *     summary: Supprimer une réclamation (Soft Delete)
 *     tags: [Reclamations]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 204: { description: Supprimé } }
 *
 * /api/preventif:
 *   get:
 *     summary: Liste des interventions préventives
 *     tags: [Preventif]
 *     security: [{ bearerAuth: [] }]
 *   post:
 *     summary: Saisir une intervention préventive
 *     tags: [Preventif]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreatePreventif' }
 *     responses: { 201: { description: Intervention créée } }
 *
 * /api/preventif/{id}:
 *   parameters:
 *     - $ref: '#/components/parameters/IdParam'
 *   get:
 *     summary: Détail de l'intervention
 *     tags: [Preventif]
 *     security: [{ bearerAuth: [] }]
 *   delete:
 *     summary: Supprimer l'intervention (Soft Delete)
 *     tags: [Preventif]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 204: { description: Supprimé } }
 *
 * /api/preventif/{id}/validate:
 *   parameters:
 *     - $ref: '#/components/parameters/IdParam'
 *   patch:
 *     summary: Valider ou Rejeter une intervention
 *     tags: [Preventif]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [valide]
 *             properties:
 *               valide:
 *                 type: boolean
 *                 example: true
 *
 * /api/users:
 *   get:
 *     summary: Liste paginée des utilisateurs
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *   post:
 *     summary: Créer un utilisateur
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateUser' }
 *     responses: { 201: { description: Utilisateur créé } }
 *
 * /api/users/{id}:
 *   parameters:
 *     - $ref: '#/components/parameters/IdParam'
 *   get:
 *     summary: Détail d'un utilisateur
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *   patch:
 *     summary: Modifier un utilisateur
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateUser' }
 *   delete:
 *     summary: Supprimer un utilisateur (Soft Delete)
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 204: { description: Supprimé } }
 */
