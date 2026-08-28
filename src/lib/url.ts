import { headers } from "next/headers";

/**
 * URL de base publique de l'app, utilisée pour construire les liens partagés.
 *
 * Priorité :
 * 1. En-têtes de la requête (host + x-forwarded-proto) — fonctionne derrière un
 *    reverse-proxy (Traefik/Dokploy, Nginx…) sans configuration.
 * 2. Variable d'environnement NEXT_PUBLIC_APP_URL (repli).
 * 3. http://localhost:3000 (dev).
 *
 * Doit être appelée dans un contexte dynamique (route/segment `force-dynamic`).
 */
export function getBaseUrl(): string {
  try {
    const h = headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) {
      const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
      return `${proto}://${host}`;
    }
  } catch {
    /* headers() indisponible hors requête */
  }
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}
