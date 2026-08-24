"use server";

import { redirect } from "next/navigation";
import { createSession, verifyPassword } from "@/lib/auth";

export async function loginAction(
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const password = String(formData.get("password") ?? "");
  const from = String(formData.get("from") ?? "/dashboard");

  if (!password) {
    return { error: "Entre ton mot de passe." };
  }

  let ok = false;
  try {
    ok = verifyPassword(password);
  } catch (e) {
    return { error: "Configuration serveur incomplète (ADMIN_PASSWORD manquant)." };
  }

  if (!ok) {
    return { error: "Mot de passe incorrect." };
  }

  await createSession();
  redirect(from.startsWith("/dashboard") ? from : "/dashboard");
}
