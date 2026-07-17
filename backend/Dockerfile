# Utilise une version de Node.js très légère et sécurisée
FROM node:22-alpine

# Crée le dossier de travail dans le conteneur
WORKDIR /app

# Copie les fichiers de dépendances en premier (optimisation du cache)
COPY package*.json ./
COPY prisma ./prisma/

# Installe uniquement les packages de production (pas nodemon, etc.)
RUN npm ci --omit=dev

# Génère le client Prisma pour Linux Alpine
RUN npx prisma generate

# Copie tout le reste du code
COPY . .

# Expose le port de l'API
EXPOSE 4000

# La commande de démarrage officiel en production
CMD ["npm", "start"]