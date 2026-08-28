"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button, Field, Input } from "@/components/ui";
import { loginAction } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" fullWidth loading={pending}>
      {pending ? "Connexion…" : "Se connecter"}
    </Button>
  );
}

export default function LoginForm({ from }: { from: string }) {
  const [state, formAction] = useFormState(loginAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="from" value={from} />
      <Field label="Mot de passe" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          autoFocus
          placeholder="••••••••"
        />
      </Field>
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
      )}
      <SubmitButton />
    </form>
  );
}
