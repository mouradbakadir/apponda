# Utilise une version de Node.js tres legere et securisee
FROM node:22-alpine

# Installe wget pour le HEALTHCHECK (deja tres leger, evite d'ajouter curl)
RUN apk add --no-cache wget

# Cree le dossier de travail dans le conteneur
WORKDIR /app

# Copie les fichiers de dependances en premier (optimisation du cache Docker)
COPY package*.json ./
COPY prisma ./prisma/

# Installe uniquement les packages de production (pas nodemon, vitest, etc.)
RUN npm ci --omit=dev

# Genere le client Prisma pour Linux Alpine
RUN npx prisma generate

# Copie tout le reste du code, en attribuant directement la propriete
# a l'utilisateur non-root "node"
COPY --chown=node:node . .

# Corrige la propriete de node_modules (installe en root a l'etape precedente,
# avant le changement d'utilisateur), pour une coherence complete des permissions.
RUN chown -R node:node node_modules

# Cree le dossier de stockage local avec les bonnes permissions
RUN mkdir -p storage && chown node:node storage

# Bascule sur l'utilisateur non-root pour toute la suite,
# y compris l'execution finale du processus Node.
USER node

# Expose le port de l'API
EXPOSE 4000

# Verifie toutes les 30 secondes que l'API repond ET que ses dependances
# critiques (PostgreSQL, Redis) sont accessibles, via l'endpoint /api/health
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-4000}/api/health || exit 1

# La commande de demarrage officielle en production
CMD ["npm", "start"]