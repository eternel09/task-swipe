import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatMoney, computeTotal } from "@/lib/format";
import { Card, Badge } from "@/components/ui";
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
  const adminServices = checklist.services.filter((s) => s.origin === "ADMIN");
  const startingTotal = adminServices.reduce((sum, s) => sum + s.price, 0);

  return (
    <main className="min-h-screen bg-gray-50 pb-28">
      {/* Hero */}
      <div className="bg-gradient-to-br from-brand-600 to-brand-800 pb-16 pt-8 text-white">
        <div className="mx-auto max-w-2xl px-4">
          <div className="flex items-center gap-2 text-brand-100">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/20 text-xs font-bold">
              ✓
            </span>
            <span className="text-sm font-medium">Proposition de services</span>
          </div>
          <h1 className="mt-3 text-2xl font-bold leading-tight sm:text-3xl">{checklist.title}</h1>
          {checklist.description && (
            <p className="mt-2 max-w-xl text-sm text-brand-100">{checklist.description}</p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-brand-100">
            <span className="rounded-full bg-white/15 px-3 py-1">
              Pour {checklist.client.company || checklist.client.name}
            </span>
            {!finalized && (
              <span className="rounded-full bg-white/15 px-3 py-1">
                {adminServices.length} service{adminServices.length > 1 ? "s" : ""} · à partir de{" "}
                {formatMoney(startingTotal, checklist.currency)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto -mt-10 max-w-2xl px-4">
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
          <ClientForm
            token={checklist.shareToken}
            currency={checklist.currency}
            alreadyResponded={checklist.status === "RESPONDED"}
            previousMessage={checklist.clientMessage ?? ""}
            adminServices={adminServices.map((s) => ({
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
    <div className="animate-fade-in space-y-4">
      <Card className="border-green-200 bg-green-50 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-600 text-white">
            ✓
          </div>
          <div>
            <p className="font-semibold text-green-800">Devis finalisé</p>
            <p className="mt-0.5 text-sm text-green-700">
              Le prestataire a validé votre devis. Voici le récapitulatif des services retenus.
            </p>
          </div>
        </div>
      </Card>
      <Card className="divide-y divide-gray-100 overflow-hidden">
        {kept.map((s, i) => (
          <div key={i} className="flex items-center justify-between gap-3 px-5 py-3.5">
            <span className="flex items-center gap-2 text-ink">
              {s.name}
              {s.origin === "CLIENT" && <Badge tone="brand">votre ajout</Badge>}
            </span>
            <span className="font-medium text-ink">{formatMoney(s.amount, currency)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between bg-gray-50 px-5 py-4">
          <span className="font-semibold text-ink">TOTAL</span>
          <span className="text-xl font-bold text-brand-700">{formatMoney(total, currency)}</span>
        </div>
      </Card>
    </div>
  );
}
