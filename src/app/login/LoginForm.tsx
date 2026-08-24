"use client";

import { useFormState, useFormStatus } from "react-dom";
import { loginAction } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Connexion…" : "Se connecter"}
    </button>
  );
}

export default function LoginForm({ from }: { from: string }) {
  const [state, formAction] = useFormState(loginAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="from" value={from} />
      <div>
        <label className="label" htmlFor="password">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoFocus
          className="input"
          placeholder="••••••••"
        />
      </div>
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
      )}
      <SubmitButton />
    </form>
  );
}
