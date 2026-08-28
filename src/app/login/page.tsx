import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { Card, CardBody } from "@/components/ui";
import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { from?: string };
}) {
  if (await isAuthenticated()) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-50 to-gray-50 px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-xl font-bold text-white shadow-float">
            ✓
          </div>
          <h1 className="text-2xl font-bold text-ink">Checklist</h1>
          <p className="mt-1 text-sm text-ink-muted">Espace prestataire</p>
        </div>
        <Card>
          <CardBody className="p-6">
            <LoginForm from={searchParams.from ?? "/dashboard"} />
          </CardBody>
        </Card>
        <p className="mt-4 text-center text-xs text-ink-subtle">
          Accès réservé. Contacte l'administrateur si tu as oublié ton mot de passe.
        </p>
      </div>
    </main>
  );
}
