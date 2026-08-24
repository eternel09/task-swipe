import Link from "next/link";
import { prisma } from "@/lib/prisma";
import NewChecklistForm from "./NewChecklistForm";

export const dynamic = "force-dynamic";

export default async function NewChecklistPage() {
  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, company: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard" className="text-sm text-brand-600 hover:underline">
          ← Retour
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Nouvelle checklist</h1>
        <p className="mt-1 text-sm text-gray-500">
          Renseigne le client et les services proposés avec leurs prix.
        </p>
      </div>
      <NewChecklistForm clients={clients} />
    </div>
  );
}
