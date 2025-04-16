FROM node:16-alpine  # Version plus légère

WORKDIR /app

# Création du user non-root (sécurité + compatibilité volumes)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
    && mkdir -p /app/assets/images \
    && chown -R appuser:appgroup /app

COPY package*.json ./

# Installation des dépendances avec user non-root
RUN npm install -f

COPY --chown=appuser:appgroup . .

# Build avec user non-root
USER appuser
RUN npm run build

# Configuration santé
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3000/api/health || exit 1

EXPOSE 3000

# Meilleure commande de démarrage
CMD ["node", "dist/main.js"]

# Correction permissions finale
RUN chmod -R 775 /app/assets