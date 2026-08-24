# Checklist — Devis clients

Petite app pour la facturation de services. Tu crées une **checklist de services** par
client, tu la partages via un **lien spécial**, le client sélectionne/retire des services,
propose ses prix, ajoute ses propres besoins et confirme. Tu reçois ses réponses sur ton
**dashboard**, tu ajustes, puis tu génères un **devis PDF** que tu envoies par email ou
WhatsApp.

## Fonctionnalités

- 🔐 **Dashboard privé** protégé par un mot de passe unique (juste toi).
- 🧾 **Création de checklists** par client (nom, société, email, téléphone) avec une liste
  de services + prix + devise personnalisable.
- 🔗 **Lien public par client** (`/c/<token>`) — pas de compte requis côté client.
- ✅ Le client **coche/décoche** les services, **propose un contre-prix**, **ajoute un
  service** non listé et laisse un message.
- 📥 Retour des réponses sur le dashboard, avec **finalisation** : tu ajustes chaque prix
  final, tu inclus/exclus, tu valides.
- 📄 **Génération d'un devis PDF** propre, prêt à envoyer.
- 💬 **Bouton WhatsApp** pré-rempli (lien de la checklist + devis final), sans clé API.

## Stack

- [Next.js 14](https://nextjs.org/) (App Router) + TypeScript
- [Prisma](https://www.prisma.io/) + SQLite (migrable vers Postgres)
- [Tailwind CSS](https://tailwindcss.com/)
- [pdf-lib](https://pdf-lib.js.org/) pour le PDF, [jose](https://github.com/panva/jose) pour la session

## Démarrage

```bash
# 1. Dépendances
npm install

# 2. Variables d'environnement
cp .env.example .env
#   → édite ADMIN_PASSWORD (ton mot de passe) et AUTH_SECRET (chaîne aléatoire longue)

# 3. Base de données
npm run db:push        # crée les tables SQLite
npm run db:seed        # (optionnel) données de démo

# 4. Lancer en dev
npm run dev            # http://localhost:3000
```

Connecte-toi sur `/login` avec le mot de passe défini dans `ADMIN_PASSWORD`.

## Variables d'environnement

| Variable              | Description                                                        |
| --------------------- | ------------------------------------------------------------------ |
| `DATABASE_URL`        | Connexion base de données (`file:./dev.db` par défaut).            |
| `ADMIN_PASSWORD`      | Mot de passe unique pour accéder au dashboard.                     |
| `AUTH_SECRET`         | Secret de signature du cookie de session (min. 16 caractères).     |
| `NEXT_PUBLIC_APP_URL` | URL publique de l'app, utilisée pour construire les liens clients. |

## Flux d'utilisation

1. **Dashboard → Nouvelle checklist** : renseigne le client et les services proposés.
2. Copie le **lien** ou envoie-le directement via **WhatsApp** au client.
3. Le client ouvre le lien, ajuste ses services et **confirme**.
4. La checklist passe en **« Répondue »** sur ton dashboard.
5. Ouvre-la, **ajuste les prix finaux**, puis **Finalise le devis**.
6. **Télécharge le PDF** et envoie-le au client (email / WhatsApp).

## Modèle de données

- **Client** — coordonnées du client.
- **Checklist** — appartient à un client, possède un `shareToken` unique, un `status`
  (`DRAFT` → `SENT` → `RESPONDED` → `FINALIZED`) et une devise.
- **Service** — appartient à une checklist. `origin` (`ADMIN`/`CLIENT`), `decision`
  (`KEPT`/`REMOVED`), `proposedPrice` (contre-offre client), `finalPrice` (validé par toi).

## Déploiement

L'app se déploie sur toute plateforme Node (Railway, Render, Fly, VPS…). Pour une base
persistante en production, bascule `DATABASE_URL` vers Postgres et change `provider` dans
`prisma/schema.prisma` en `postgresql`, puis `npm run db:push`.
