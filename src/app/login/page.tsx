import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
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
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-xl font-bold text-white">
            ✓
          </div>
          <h1 className="text-2xl font-bold">Checklist</h1>
          <p className="mt-1 text-sm text-gray-500">Espace prestataire</p>
        </div>
        <div className="card p-6">
          <LoginForm from={searchParams.from ?? "/dashboard"} />
        </div>
      </div>
    </main>
  );
}
