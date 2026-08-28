#!/bin/sh
set -e

# S'assure que le dossier de données existe (monté en volume pour persister la base SQLite)
mkdir -p /app/data

# Applique le schéma Prisma sur la base (crée les tables si nécessaire)
echo "→ Synchronisation du schéma Prisma…"
npx prisma db push --skip-generate

# Démarre l'application Next.js
echo "→ Démarrage de l'application…"
exec npm run start
