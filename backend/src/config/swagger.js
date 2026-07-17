import swaggerJsdoc from 'swagger-jsdoc';

// ─── Schémas réutilisables ──────────────────────────────────────────────────
const schemas = {
  CreateMarche: {
    type: 'object',
    required: ['numeroMarche', 'objet', 'typeMaintenance', 'slaDisponibilite', 'slaPrr', 'slaMrt', 'dateDebut', 'dateFin'],
    properties: {
      numeroMarche: { type: 'string', example: 'MCH-2026-099' },
      objet: { type: 'string', example: 'Maintenance équipements CVC' },
      typeMaintenance: { type: 'string', enum: ['PREVENTIVE', 'CORRECTIVE', 'MIXTE'], example: 'PREVENTIVE' },
      slaDisponibilite: { type: 'number', example: 98 },
      slaPrr: { type: 'number', example: 95 },
      slaMrt: { type: 'number', example: 45 },
      dateDebut: { type: 'string', example: '2026-01-01' },
      dateFin: { type: 'string', example: '2026-12-31' },
      montantTotal: { type: 'number', example: 500000 },
      penaliteParInfraction: { type: 'number', example: 5000 },
    },
  },
  CreateSociete: {
    type: 'object',
    required: ['marcheId', 'raisonSociale', 'rcNumber', 'ice', 'adresse', 'telephone', 'emailContact', 'emailNotification', 'contactUrgenceNom', 'contactUrgenceTel'],
    properties: {
      marcheId: { type: 'string', example: 'd101e131-d3c0-4420-9292-5782c511152d' },
      raisonSociale: { type: 'string', example: 'SODETEC MAROC' },
      rcNumber: { type: 'string', example: 'RC-123456' },
      ice: { type: 'string', example: '001234567000012' },
      adresse: { type: 'string', example: 'Zone Industrielle, Casablanca' },
      telephone: { type: 'string', example: '0522-123456' },
      emailContact: { type: 'string', example: 'contact@sodetec.ma' },
      emailNotification: { type: 'string', example: 'notif@sodetec.ma' },
      contactUrgenceNom: { type: 'string', example: 'Mohammed Alami' },
      contactUrgenceTel: { type: 'string', example: '0661-123456' },
    },
  },
  CreateEquipement: {
    type: 'object',
    required: ['marcheId', 'societeId', 'codeEquipement', 'designation', 'categorie', 'localisation'],
    properties: {
      marcheId: { type: 'string', example: 'd101e131-d3c0-4420-9292-5782c511152d' },
      societeId: { type: 'string', example: 'UUID-DE-LA-SOCIETE' },
      codeEquipement: { type: 'string', example: 'EQ-CVC-001' },
      designation: { type: 'string', example: 'Climatiseur Hall Départ' },
      categorie: { type: 'string', enum: ['ELECTRIQUE', 'MECANIQUE', 'CVC', 'INCENDIE', 'BALISAGE', 'PASSERELLE', 'ASCENSEUR', 'AUTRE'], example: 'CVC' },
      localisation: { type: 'string', example: 'Hall Départ - Niveau 1' },
      criticite: { type: 'string', enum: ['CRITIQUE', 'IMPORTANT', 'STANDARD'], example: 'IMPORTANT' },
      dateMiseEnService: { type: 'string', example: '2023-01-01' },
      heuresFonctionnementJour: { type: 'number', example: 16 },
    },
  },
  CreatePanne: {
    type: 'object',
    required: ['equipementId', 'tPanne', 'causePanne', 'description', 'impact'],
    properties: {
      equipementId: { type: 'string', example: 'UUID-DE-LEQUIPEMENT' },
      tPanne: { type: 'string', example: '2026-06-15T10:00:00.000Z' },
      tReprise: { type: 'string', example: '2026-06-15T12:00:00.000Z' },
      causePanne: { type: 'string', enum: ['USURE', 'DEFAUT_ELECTRIQUE', 'DEFAUT_MECANIQUE', 'FACTEUR_EXTERNE', 'INCONNU'], example: 'DEFAUT_ELECTRIQUE' },
      description: { type: 'string', example: 'Panne de test pour audit KPI' },
      actionsCorrectives: { type: 'string', example: 'Remplacement du fusible' },
      impact: { type: 'string', enum: ['CRITIQUE', 'MAJEUR', 'MINEUR'], example: 'MINEUR' },
    },
  },
  ClosePanne: {
    type: 'object',
    required: ['tReprise'],
    properties: {
      tReprise: { type: 'string', example: '2026-06-15T12:00:00.000Z' },
      actionsCorrectives: { type: 'string', example: 'Remplacement du fusible' },
    },
  },
  CreateReclamation: {
    type: 'object',
    required: ['panneId', 'tNotification', 'moyenNotification'],
    properties: {
      panneId: { type: 'string', example: 'UUID-DE-LA-PANNE' },
      tNotification: { type: 'string', example: '2026-06-15T10:05:00.000Z' },
      moyenNotification: { type: 'string', enum: ['APPEL', 'EMAIL', 'SMS', 'APPLICATION'], example: 'APPLICATION' },
      tArrivee: { type: 'string', example: '2026-06-15T10:25:00.000Z' },
      commentaire: { type: 'string', example: 'Intervention urgente requise' },
    },
  },
  CreatePreventif: {
    type: 'object',
    required: ['equipementId', 'mois', 'nbInterventionsPlanifiees', 'nbInterventionsRealisees'],
    properties: {
      equipementId: { type: 'string', example: 'UUID-DE-LEQUIPEMENT' },
      mois: { type: 'string', example: '2026-06-01' },
      nbInterventionsPlanifiees: { type: 'integer', example: 4 },
      nbInterventionsRealisees: { type: 'integer', example: 3 },
      observations: { type: 'string', example: 'Une intervention reportée' },
    },
  },
  ValidatePreventif: {
    type: 'object',
    required: ['valide'],
    properties: {
      valide: { type: 'boolean', example: true },
    },
  },
  CreateUser: {
    type: 'object',
    required: ['email', 'password', 'nom', 'prenom', 'role'],
    properties: {
      email: { type: 'string', example: 'nouveau@onda.ma' },
      password: { type: 'string', example: 'MotDePasse123!' },
      nom: { type: 'string', example: 'Alami' },
      prenom: { type: 'string', example: 'Youssef' },
      role: { type: 'string', enum: ['SUPER_ADMIN', 'SUPERVISEUR', 'TECHNICIEN'], example: 'TECHNICIEN' },
      airportId: { type: 'string', example: '96e0dd1b-c62a-4652-abc9-d4e31c438ba7', description: 'Obligatoire pour SUPERVISEUR et TECHNICIEN' },
    },
  },
};

// ─── Paramètre ID réutilisable ───────────────────────────────────────────────
const idParam = { in: 'path', name: 'id', required: true, schema: { type: 'string' }, description: 'ID de l\'entité (UUID)' };
const bearer = [{ bearerAuth: [] }];
const ok200 = { 200: { description: 'Succès' } };
const ok201 = { 201: { description: 'Créé avec succès' } };
const ok204 = { 204: { description: 'Supprimé avec succès' } };

// Helper pour les requêtes avec body
const body = (schemaName) => ({
  required: true,
  content: { 'application/json': { schema: { $ref: `#/components/schemas/${schemaName}` } } },
});

// Paramètres de pagination communs à tous les GET de liste
const paginationParams = [
  { in: 'query', name: 'page', required: false, schema: { type: 'integer', default: 1 }, description: 'Numéro de page (défaut: 1)' },
  { in: 'query', name: 'limit', required: false, schema: { type: 'integer', default: 10 }, description: 'Nombre de résultats par page (défaut: 10)' },
];

// ─── Définition des paths ────────────────────────────────────────────────────
const paths = {
  // ── KPI ──────────────────────────────────────────────────────────────────
  '/api/kpi/marche/{marcheId}': {
    get: {
      tags: ['KPI'], summary: 'Calculer les KPIs d\'un marché', security: bearer,
      parameters: [
        { in: 'path', name: 'marcheId', required: true, schema: { type: 'string' }, description: 'ID du marché' },
        { in: 'query', name: 'dateDebut', required: true, schema: { type: 'string' }, description: 'Ex: 2026-01-01' },
        { in: 'query', name: 'dateFin', required: true, schema: { type: 'string' }, description: 'Ex: 2026-12-31' },
      ],
      responses: ok200,
    },
  },
  '/api/kpi/marche/{marcheId}/generate-pdf': {
    post: {
      tags: ['KPI'], summary: 'Générer rapport PDF (Asynchrone)', security: bearer,
      parameters: [{ in: 'path', name: 'marcheId', required: true, schema: { type: 'string' } }],
      responses: { 202: { description: 'Génération lancée en arrière-plan' } },
    },
  },

  // ── Marchés ───────────────────────────────────────────────────────────────
  '/api/marches': {
    get: { tags: ['Marches'], summary: 'Liste paginée des marchés', security: bearer, parameters: paginationParams, responses: ok200 },
    post: { tags: ['Marches'], summary: 'Créer un marché', security: bearer, requestBody: body('CreateMarche'), responses: ok201 },
  },
  '/api/marches/{id}': {
    parameters: [idParam],
    get: { tags: ['Marches'], summary: 'Détail d\'un marché', security: bearer, responses: ok200 },
    patch: { tags: ['Marches'], summary: 'Modifier un marché', security: bearer, requestBody: body('CreateMarche'), responses: ok200 },
    delete: { tags: ['Marches'], summary: 'Supprimer un marché (Soft Delete)', security: bearer, responses: ok204 },
  },

  // ── Sociétés ──────────────────────────────────────────────────────────────
  '/api/societes': {
    get: { tags: ['Societes'], summary: 'Liste paginée des sociétés', security: bearer, parameters: paginationParams, responses: ok200 },
    post: { tags: ['Societes'], summary: 'Créer une société', security: bearer, requestBody: body('CreateSociete'), responses: ok201 },
  },
  '/api/societes/{id}': {
    parameters: [idParam],
    get: { tags: ['Societes'], summary: 'Détail d\'une société', security: bearer, responses: ok200 },
    patch: { tags: ['Societes'], summary: 'Modifier une société', security: bearer, requestBody: body('CreateSociete'), responses: ok200 },
    delete: { tags: ['Societes'], summary: 'Supprimer une société (Soft Delete)', security: bearer, responses: ok204 },
  },

  // ── Équipements ───────────────────────────────────────────────────────────
  '/api/equipements': {
    get: { tags: ['Equipements'], summary: 'Liste paginée des équipements', security: bearer, parameters: paginationParams, responses: ok200 },
    post: { tags: ['Equipements'], summary: 'Créer un équipement', security: bearer, requestBody: body('CreateEquipement'), responses: ok201 },
  },
  '/api/equipements/{id}': {
    parameters: [idParam],
    get: { tags: ['Equipements'], summary: 'Détail d\'un équipement', security: bearer, responses: ok200 },
    patch: { tags: ['Equipements'], summary: 'Modifier un équipement', security: bearer, requestBody: body('CreateEquipement'), responses: ok200 },
    delete: { tags: ['Equipements'], summary: 'Supprimer un équipement (Soft Delete)', security: bearer, responses: ok204 },
  },

  // ── Pannes ────────────────────────────────────────────────────────────────
  '/api/pannes': {
    get: { tags: ['Pannes'], summary: 'Liste paginée des pannes', security: bearer, parameters: paginationParams, responses: ok200 },
    post: { tags: ['Pannes'], summary: 'Déclarer une panne', security: bearer, requestBody: body('CreatePanne'), responses: ok201 },
  },
  '/api/pannes/{id}': {
    parameters: [idParam],
    get: { tags: ['Pannes'], summary: 'Détail d\'une panne', security: bearer, responses: ok200 },
    delete: { tags: ['Pannes'], summary: 'Supprimer une panne (Soft Delete)', security: bearer, responses: ok204 },
  },
  '/api/pannes/{id}/close': {
    parameters: [idParam],
    patch: { tags: ['Pannes'], summary: 'Clôturer une panne', security: bearer, requestBody: body('ClosePanne'), responses: ok200 },
  },

  // ── Réclamations ──────────────────────────────────────────────────────────
  '/api/reclamations': {
    get: { tags: ['Reclamations'], summary: 'Liste paginée des réclamations', security: bearer, parameters: paginationParams, responses: ok200 },
    post: { tags: ['Reclamations'], summary: 'Saisir une réclamation', security: bearer, requestBody: body('CreateReclamation'), responses: ok201 },
  },
  '/api/reclamations/{id}': {
    parameters: [idParam],
    get: { tags: ['Reclamations'], summary: 'Détail d\'une réclamation', security: bearer, responses: ok200 },
    delete: { tags: ['Reclamations'], summary: 'Supprimer une réclamation (Soft Delete)', security: bearer, responses: ok204 },
  },

  // ── Préventif ─────────────────────────────────────────────────────────────
  '/api/preventif': {
    get: { tags: ['Preventif'], summary: 'Liste des interventions préventives', security: bearer, parameters: paginationParams, responses: ok200 },
    post: { tags: ['Preventif'], summary: 'Saisir une intervention préventive', security: bearer, requestBody: body('CreatePreventif'), responses: ok201 },
  },
  '/api/preventif/{id}': {
    parameters: [idParam],
    get: { tags: ['Preventif'], summary: 'Détail d\'une intervention', security: bearer, responses: ok200 },
    delete: { tags: ['Preventif'], summary: 'Supprimer une intervention (Soft Delete)', security: bearer, responses: ok204 },
  },
  '/api/preventif/{id}/validate': {
    parameters: [idParam],
    patch: { tags: ['Preventif'], summary: 'Valider ou Rejeter une intervention', security: bearer, requestBody: body('ValidatePreventif'), responses: ok200 },
  },

  // ── Utilisateurs ──────────────────────────────────────────────────────────
  '/api/users': {
    get: { tags: ['Users'], summary: 'Liste paginée des utilisateurs', security: bearer, parameters: paginationParams, responses: ok200 },
    post: { tags: ['Users'], summary: 'Créer un utilisateur', security: bearer, requestBody: body('CreateUser'), responses: ok201 },
  },
  '/api/users/{id}': {
    parameters: [idParam],
    get: { tags: ['Users'], summary: 'Détail d\'un utilisateur', security: bearer, responses: ok200 },
    patch: { tags: ['Users'], summary: 'Modifier un utilisateur', security: bearer, requestBody: body('CreateUser'), responses: ok200 },
    delete: { tags: ['Users'], summary: 'Supprimer un utilisateur (Soft Delete)', security: bearer, responses: ok204 },
  },
};

// ─── Configuration swagger-jsdoc ─────────────────────────────────────────────
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Backend ONDA',
      version: '1.0.0',
      description: 'Documentation interactive de la plateforme de gestion ONDA',
    },
    servers: [{ url: 'http://localhost:4000', description: 'Serveur de Développement' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas,
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'KPI', description: 'Statistiques et Performances (PRR, MRT, Disponibilité)' },
      { name: 'Marches', description: 'Gestion des marchés ONDA' },
      { name: 'Societes', description: 'Entreprises prestataires' },
      { name: 'Equipements', description: 'Équipements de l\'aéroport' },
      { name: 'Pannes', description: 'Suivi des pannes' },
      { name: 'Reclamations', description: 'Réclamations et suivi SLA' },
      { name: 'Preventif', description: 'Interventions préventives' },
      { name: 'Users', description: 'Gestion des utilisateurs (Super Admin)' },
      { name: 'Auth', description: 'Authentification JWT' },
    ],
    paths,
  },
  // Seul le fichier auth.routes.js utilise encore les commentaires @swagger
  apis: ['./src/routes/auth.routes.js'],
};

export const swaggerSpec = swaggerJsdoc(options);