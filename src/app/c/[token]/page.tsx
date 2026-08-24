import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatMoney, computeTotal } from "@/lib/format";
import ClientForm from "./ClientForm";

export const dynamic = "force-dynamic";

export default async function PublicChecklistPage({
  params,
}: {
  params: { token: string };
}) {
  const checklist = await prisma.checklist.findUnique({
    where: { shareToken: params.token },
    include: { client: true, services: { orderBy: { position: "asc" } } },
  });

  if (!checklist) notFound();

  const finalized = checklist.status === "FINALIZED";

  return (
    <main className="min-h-screen bg-gray-50 pb-16">
      <div className="bg-brand-600 py-8 text-white">
        <div className="mx-auto max-w-2xl px-4">
          <p className="text-sm text-brand-100">Proposition de services</p>
          <h1 className="mt-1 text-2xl font-bold">{checklist.title}</h1>
          {checklist.description && (
            <p className="mt-2 text-sm text-brand-100">{checklist.description}</p>
          )}
          <p className="mt-3 text-sm text-brand-100">
            Pour : {checklist.client.company || checklist.client.name}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4">
        {finalized ? (
          <FinalizedView
            services={checklist.services.map((s) => ({
              name: s.name,
              decision: s.decision,
              amount: s.finalPrice ?? s.proposedPrice ?? s.price,
              origin: s.origin,
            }))}
            total={computeTotal(checklist.services)}
            currency={checklist.currency}
          />
        ) : (
          <div className="-mt-6">
            <ClientForm
              token={checklist.shareToken}
              currency={checklist.currency}
              alreadyResponded={checklist.status === "RESPONDED"}
              previousMessage={checklist.clientMessage ?? ""}
              adminServices={checklist.services
                .filter((s) => s.origin === "ADMIN")
                .map((s) => ({
                  id: s.id,
                  name: s.name,
                  description: s.description,
                  price: s.price,
                  keep: s.decision !== "REMOVED",
                  proposedPrice: s.proposedPrice,
                }))}
              clientServices={checklist.services
                .filter((s) => s.origin === "CLIENT")
                .map((s) => ({
                  name: s.name,
                  description: s.description,
                  price: s.price,
                }))}
            />
          </div>
        )}
      </div>
    </main>
  );
}

function FinalizedView({
  services,
  total,
  currency,
}: {
  services: { name: string; decision: string; amount: number; origin: string }[];
  total: number;
  currency: string;
}) {
  const kept = services.filter((s) => s.decision === "KEPT");
  return (
    <div className="mt-6 space-y-4">
      <div className="card border-green-200 bg-green-50 p-5 text-green-800">
        <p className="font-semibold">Devis finalisé ✓</p>
        <p className="mt-1 text-sm">
          Le prestataire a validé votre devis. Voici le récapitulatif des services retenus.
        </p>
      </div>
      <div className="card divide-y divide-gray-100">
        {kept.map((s, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-3">
            <span>{s.name}</span>
            <span className="font-medium">{formatMoney(s.amount, currency)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between px-5 py-4">
          <span className="font-semibold">TOTAL</span>
          <span className="text-lg font-bold text-brand-700">
            {formatMoney(total, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}
