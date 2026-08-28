# Déploiement sur Dokploy

Guide pas-à-pas pour déployer l'app **Checklist** sur une instance [Dokploy](https://dokploy.com).
Le repo est déjà prêt : `Dockerfile`, entrypoint (applique le schéma Prisma au démarrage),
et l'URL des liens partagés est déduite automatiquement du domaine (aucun build-arg à gérer).

## Prérequis

- Une instance Dokploy fonctionnelle (accès à son interface web).
- GitHub connecté à Dokploy (Settings → Git → GitHub) avec accès au repo `eternel09/task-swipe`.

## Étapes (méthode recommandée : Application + Dockerfile)

### 1. Créer le projet et l'application
1. Dokploy → **Create Project** (ex. `checklist`).
2. Dans le projet → **Create Service** → **Application**.

### 2. Source
1. Onglet **Provider** → **GitHub**.
2. Repository : `eternel09/task-swipe` · Branch : `main`.
3. **Build Type** : **Dockerfile** · Dockerfile Path : `Dockerfile`.

### 3. Variables d'environnement
Onglet **Environment** — colle ceci (remplace les valeurs) :

```
ADMIN_PASSWORD=ton-mot-de-passe-solide
AUTH_SECRET=une-chaine-aleatoire-de-32-caracteres-minimum
DATABASE_URL=file:/app/data/prod.db
```

> `AUTH_SECRET` : génère-le, ex. `openssl rand -hex 32`.
> `NEXT_PUBLIC_APP_URL` n'est **pas nécessaire** : les liens partagés utilisent
> automatiquement le domaine configuré ci-dessous (via les en-têtes du reverse-proxy).

### 4. Volume persistant (⚠️ indispensable pour ne pas perdre les données)
Onglet **Advanced → Volumes / Mounts** → **Add Mount** :
- Type : **Volume Mount**
- Volume Name : `checklist-data`
- Mount Path : `/app/data`

La base SQLite vit dans ce volume et survit aux redéploiements.

### 5. Domaine + HTTPS
Onglet **Domains** → **Add Domain** :
- Host : `checklist.tondomaine.com` (ou le sous-domaine voulu, DNS pointant vers le serveur Dokploy)
- **Container Port : `3000`**
- **HTTPS : activé** (Let's Encrypt) · Certificate : Let's Encrypt

### 6. Déployer
Clique sur **Deploy**. Dokploy build l'image Docker puis démarre le conteneur.
Au premier démarrage, le schéma Prisma est appliqué automatiquement (`prisma db push`).

Suis les logs dans l'onglet **Deployments / Logs**. Une fois vert, ouvre ton domaine :
- `/login` → connecte-toi avec `ADMIN_PASSWORD`.

### 7. (Optionnel) Auto-déploiement
Onglet **Deployments** → active le **Webhook GitHub** (ou l'auto-deploy) pour redéployer
automatiquement à chaque push sur `main`.

## Vérification post-déploiement
1. `/login` accessible et connexion OK.
2. Crée une checklist, copie le lien partagé → il doit pointer vers **ton domaine** (pas localhost).
3. Ouvre le lien en navigation privée (côté client), réponds, confirme.
4. Reviens au dashboard → finalise → télécharge le PDF.

## Alternative : déploiement via Docker Compose
Dokploy sait aussi déployer un service **Compose** à partir du `docker-compose.yml` du repo.
La méthode Application + Dockerfile ci-dessus est cependant plus simple pour les domaines/HTTPS
(gérés nativement par Dokploy/Traefik). Si tu utilises Compose, attache le domaine au service
`web` (port 3000) via l'interface Dokploy.

## Dépannage
- **Les liens partagés montrent `localhost`** → le domaine n'est pas attaché, ou tu accèdes à
  l'app sans passer par le domaine Dokploy. Passe toujours par le domaine.
- **Données perdues après un redéploiement** → le volume `/app/data` n'a pas été monté (étape 4).
- **Erreur Prisma au démarrage** → vérifie `DATABASE_URL=file:/app/data/prod.db` et que le
  volume est bien monté et accessible en écriture.
