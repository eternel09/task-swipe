import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "cl_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 jours

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "AUTH_SECRET manquant ou trop court. Définis-le dans .env (min 16 caractères)."
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(): Promise<void> {
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(getSecret());

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export function destroySession(): void {
  cookies().delete(COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

/** Vérifie le mot de passe admin contre la variable d'environnement. */
export function verifyPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    throw new Error("ADMIN_PASSWORD n'est pas défini dans .env");
  }
  return password === expected;
}
