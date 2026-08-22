# Plateforme de gestion de maintenance aéroportuaire (ONDA)

## Présentation

**AMNT ONDA** est une plateforme web dédiée à la gestion et au suivi des activités de maintenance dans le domaine aéroportuaire.

L'application a pour objectif de centraliser les informations liées à la maintenance, aux équipements, aux interventions, aux marchés et aux différents indicateurs de performance afin de faciliter le suivi des activités et la prise de décision.

La plateforme permet aux différents profils utilisateurs d'accéder aux fonctionnalités correspondant à leurs responsabilités.

---

## Objectifs

La plateforme vise principalement à :

- centraliser les données relatives à la maintenance aéroportuaire ;
- améliorer le suivi des équipements et des interventions ;
- faciliter la gestion des pannes ;
- assurer le suivi de la maintenance préventive ;
- gérer les marchés et les sociétés prestataires ;
- centraliser les documents associés aux marchés ;
- suivre les réclamations ;
- calculer et visualiser les indicateurs de performance ;
- faciliter l'analyse des données ;
- automatiser certaines tâches de traitement et de génération de contenu ;
- améliorer la traçabilité des opérations ;
- fournir une interface permettant une meilleure prise de décision.

---

# Fonctionnalités principales

## 1. Authentification et gestion des utilisateurs

La plateforme dispose d'un système d'authentification permettant de sécuriser l'accès à l'application.

Les utilisateurs sont gérés selon leurs rôles et leurs responsabilités.

Les principales fonctionnalités sont :

- connexion sécurisée ;
- gestion des sessions ;
- gestion des utilisateurs ;
- gestion des rôles ;
- contrôle des permissions ;
- protection des différentes fonctionnalités de l'application.

---

## 2. Gestion des aéroports

La plateforme permet de gérer les différents aéroports pris en charge par le système.

Les informations peuvent être associées à un aéroport afin de permettre une analyse et un suivi spécifiques à chaque site.

Les fonctionnalités comprennent notamment :

- consultation des aéroports ;
- sélection d'un aéroport ;
- association des données aux aéroports ;
- filtrage des informations par aéroport.

---

## 3. Gestion des marchés

Le module de gestion des marchés permet de centraliser les informations relatives aux différents marchés de maintenance.

Il permet notamment de :

- créer un marché ;
- consulter les marchés ;
- modifier les informations d'un marché ;
- rechercher un marché ;
- filtrer les marchés ;
- suivre les informations contractuelles ;
- associer des sociétés aux marchés ;
- associer des documents aux marchés.

---

## 4. Gestion des sociétés

La plateforme permet de gérer les sociétés intervenant dans le cadre des activités de maintenance.

Les informations relatives aux sociétés peuvent être associées aux marchés et aux différentes activités concernées.

---

## 5. Gestion des équipements

Le module équipements permet de centraliser les informations relatives aux équipements présents dans les différents environnements aéroportuaires.

Il permet notamment de :

- consulter les équipements ;
- rechercher un équipement ;
- suivre leur état ;
- associer les équipements aux activités de maintenance ;
- suivre les interventions associées.

---

## 6. Gestion des pannes

La plateforme permet d'enregistrer et de suivre les pannes affectant les équipements.

Le suivi permet notamment de :

- déclarer une panne ;
- consulter les pannes ;
- suivre leur statut ;
- associer une panne à un équipement ;
- suivre les actions réalisées ;
- assurer la traçabilité des interventions.

---

## 7. Maintenance préventive

Le module de maintenance préventive permet de planifier et de suivre les opérations de maintenance réalisées périodiquement.

Il permet notamment de suivre :

- les équipements concernés ;
- les opérations prévues ;
- les échéances ;
- les interventions réalisées ;
- l'état d'avancement ;
- l'historique des opérations.

---

## 8. Gestion des interventions

Les interventions de maintenance peuvent être enregistrées et suivies depuis la plateforme.

Les informations peuvent notamment concerner :

- l'équipement ;
- le type d'intervention ;
- la date ;
- le statut ;
- les actions réalisées ;
- les observations ;
- les intervenants concernés.

---

## 9. Gestion des réclamations

La plateforme comprend un module permettant de gérer les réclamations.

Il permet de :

- enregistrer une réclamation ;
- consulter les réclamations ;
- suivre leur statut ;
- rechercher et filtrer les réclamations ;
- assurer le suivi des actions associées.

---

## 10. Gestion documentaire

La plateforme permet d'associer des documents aux différents éléments métier, notamment aux marchés.

Les documents peuvent être :

- ajoutés ;
- consultés ;
- téléchargés ;
- associés à un marché ;
- analysés et exploités dans le cadre des processus de l'application.

Cette fonctionnalité permet de centraliser les documents nécessaires au suivi des activités.

---

## 11. Traitement intelligent des documents

La plateforme intègre des fonctionnalités permettant d'automatiser certaines opérations liées aux documents.

Le processus général peut être représenté comme suit :

```text
Document
   │
   ▼
Importation
   │
   ▼
Traitement
   │
   ▼
Extraction des informations
   │
   ▼
Structuration des données
   │
   ▼
Exploitation dans l'application
````

Cette fonctionnalité permet de réduire les opérations manuelles et de faciliter l'exploitation des informations contenues dans les documents.

---

## 12. Génération de contenu

Certaines fonctionnalités permettent d'assister l'utilisateur dans la préparation de contenus à partir des données disponibles dans la plateforme.

Cette fonctionnalité peut notamment être utilisée pour préparer des brouillons et faciliter certaines communications.

---

## 13. Tableau de bord

La plateforme dispose d'un tableau de bord permettant d'obtenir une vision synthétique de l'activité.

Il permet notamment de visualiser :

* les principaux indicateurs ;
* les statistiques ;
* les données par aéroport ;
* les informations relatives aux marchés ;
* les informations relatives à la maintenance ;
* l'évolution des différents indicateurs.

---

## 14. KPI et indicateurs de performance

Le système permet de suivre différents indicateurs de performance liés aux activités de maintenance.

Les indicateurs peuvent être consultés sous différentes formes afin de faciliter :

* le suivi des performances ;
* l'analyse des tendances ;
* l'identification des anomalies ;
* la comparaison des résultats ;
* la prise de décision.

---

## 15. Suivi des SLO

La plateforme permet également de suivre les indicateurs liés aux niveaux de service.

Le module permet de consulter et d'analyser les informations nécessaires au suivi des engagements et des performances.

---

# Architecture de l'application

L'application est organisée autour de deux parties principales :

```text
                 ┌──────────────────────┐
                 │       Utilisateur    │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │      Frontend        │
                 │   Interface Web      │
                 └──────────┬───────────┘
                            │
                         API HTTP
                            │
                            ▼
                 ┌──────────────────────┐
                 │       Backend        │
                 │    API / Services    │
                 └──────────┬───────────┘
                            │
             ┌──────────────┼──────────────┐
             │              │              │
             ▼              ▼              ▼
        Base de données   Traitements   Services
                         asynchrones    applicatifs
```

---

# Technologies utilisées

## Frontend

* React
* Vite
* React Router
* Axios
* Chart.js
* jsPDF
* XLSX

## Backend

* Node.js
* Express.js
* Prisma
* PostgreSQL
* JWT
* bcrypt
* Zod
* Multer
* Nodemailer
* Swagger / OpenAPI

## Traitements asynchrones

* Redis
* BullMQ
* Workers

## Conteneurisation

* Docker
* Docker Compose

---

# Structure du projet

```text
AMNT-ONDA/
│
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.js
│   │
│   ├── src/
│   │   ├── ai/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── jobs/
│   │   ├── middlewares/
│   │   ├── prompts/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── validators/
│   │
│   ├── tests/
│   ├── storage/
│   ├── package.json
│   ├── package-lock.json
│   └── Dockerfile
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── styles/
│   │   └── utils/
│   │
│   ├── package.json
│   ├── package-lock.json
│   └── Dockerfile
│
├── docker-compose.yml
└── README.md
```

---

# Base de données

La plateforme utilise une base de données relationnelle PostgreSQL.

La gestion de la base de données est réalisée avec Prisma ORM.

Le schéma principal est disponible dans :

```text
backend/prisma/schema.prisma
```

Les évolutions de la base sont gérées avec les migrations Prisma :

```text
backend/prisma/migrations/
```

---

# Installation

## Prérequis

Avant d'installer le projet, il est nécessaire d'avoir :

* Node.js ;
* npm ;
* Docker Desktop ;
* Docker Compose ;
* PostgreSQL ;
* Redis.

---

# Installation du backend

Se placer dans le dossier backend :

```bash
cd backend
```

Installer les dépendances :

```bash
npm install
```

Générer le client Prisma :

```bash
npx prisma generate
```

Appliquer les migrations :

```bash
npx prisma migrate deploy
```

---

# Installation du frontend

Se placer dans le dossier frontend :

```bash
cd frontend
```

Installer les dépendances :

```bash
npm install
```

---

# Configuration

Les fichiers de configuration d'environnement sont basés sur :

```text
backend/.env.example
frontend/.env.example
```

Créer ensuite les fichiers `.env` correspondants avec les paramètres de l'environnement local.

> Les fichiers `.env` contenant des mots de passe, clés API ou secrets ne doivent pas être partagés.

---

# Lancement avec Docker

Pour construire et démarrer les services :

```bash
docker compose up -d --build
```

Vérifier l'état des services :

```bash
docker compose ps
```

Afficher les logs :

```bash
docker compose logs -f
```

Pour arrêter les services :

```bash
docker compose down
```

---

# Lancement en développement

## Backend

```bash
cd backend
npm run dev
```

## Frontend

```bash
cd frontend
npm run dev
```

---

# Tests

Les tests backend sont disponibles dans :

```text
backend/tests/
```

Lancer les tests avec :

```bash
npm test
```

---

# Documentation API

Le backend expose une API REST.

La documentation de l'API est basée sur Swagger / OpenAPI.

Les fichiers de configuration de la documentation se trouvent notamment dans :

```text
backend/src/config/
```

---

# Sécurité

La plateforme met en œuvre plusieurs mécanismes de sécurité :

* authentification JWT ;
* gestion des rôles et permissions ;
* hashage des mots de passe ;
* validation des données ;
* protection des routes ;
* contrôle des accès ;
* gestion sécurisée des variables d'environnement ;
* limitation des requêtes ;
* gestion centralisée des erreurs.

Les informations sensibles ne doivent pas être intégrées directement dans le code source.

---

# Traitements asynchrones

Certaines opérations peuvent être exécutées de manière asynchrone afin d'éviter de bloquer les requêtes utilisateur.

L'architecture utilise :

```text
Application
     │
     ▼
   Queue
     │
     ▼
   Redis
     │
     ▼
   Worker
     │
     ▼
Traitement
```

Cette architecture permet notamment de traiter certaines opérations longues liées aux documents et aux traitements métier.

---

# Gestion des documents

Les documents utilisés par l'application sont associés aux différents éléments métier.

Le répertoire de stockage utilisé par le backend est :

```text
backend/storage/
```

Pour le partage du projet, les documents contenant des données confidentielles ou métier doivent être exclus de l'archive.

---

# Bonnes pratiques pour le partage du projet

Avant de transmettre le projet :

* ne pas inclure les fichiers `.env` ;
* ne pas inclure les mots de passe réels ;
* ne pas inclure les clés API ;
* ne pas inclure `node_modules` ;
* ne pas inclure les fichiers temporaires ;
* ne pas inclure les documents métier confidentiels ;
* conserver les fichiers `.env.example` ;
* conserver `package.json` et `package-lock.json` ;
* conserver les migrations Prisma ;
* conserver le code source ;
* conserver les tests ;
* conserver le fichier `docker-compose.yml`.

---

# Commandes utiles

### Installer les dépendances

```bash
npm install
```

### Développement

```bash
npm run dev
```

### Tests

```bash
npm test
```

### Build frontend

```bash
npm run build
```

### Docker

```bash
docker compose up -d --build
```

### Arrêter Docker

```bash
docker compose down
```

### Afficher les logs

```bash
docker compose logs -f
```

---

# Projet

**Nom : AMNT ONDA**

**Intitulé : Plateforme de gestion de maintenance aéroportuaire (ONDA)**

Projet réalisé dans le cadre d'un Projet de Fin d'Études.

---

## Conclusion

AMNT ONDA constitue une plateforme centralisée destinée à faciliter la gestion, le suivi et l'analyse des activités de maintenance aéroportuaire.

L'application regroupe les fonctionnalités de gestion des équipements, des interventions, des pannes, de la maintenance préventive, des marchés, des sociétés, des documents, des réclamations et des indicateurs de performance dans une même plateforme.

L'objectif est d'améliorer la centralisation des données, la traçabilité des opérations et la visibilité sur les performances de maintenance.

