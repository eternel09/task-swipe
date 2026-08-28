import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { computeTotal, formatMoney, formatDate } from "@/lib/format";
import { Card, Button, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const checklists = await prisma.checklist.findMany({
    orderBy: { updatedAt: "desc" },
    include: { client: true, services: true },
  });

  const stats = {
    total: checklists.length,
    responded: checklists.filter((c) => c.status === "RESPONDED").length,
    finalized: checklists.filter((c) => c.status === "FINALIZED").length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-ink">Mes checklists</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Crée une checklist par client, partage le lien, reçois ses réponses et génère le devis.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Répondues / en attente" value={stats.responded} accent="amber" />
        <StatCard label="Devis finalisés" value={stats.finalized} accent="green" />
      </div>

      {checklists.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <p className="text-ink-muted">Aucune checklist pour l'instant.</p>
          <Link href="/dashboard/checklists/new">
            <Button>+ Créer ma première checklist</Button>
          </Link>
        </Card>
      ) : (
        <Card className="divide-y divide-gray-100 overflow-hidden">
          {checklists.map((c) => {
            const total = computeTotal(c.services);
            const keptCount = c.services.filter((s) => s.decision === "KEPT").length;
            return (
              <Link
                key={c.id}
                href={`/dashboard/checklists/${c.id}`}
                className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-gray-50"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold text-ink">{c.title}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="mt-0.5 truncate text-sm text-ink-muted">
                    {c.client.company || c.client.name} · {keptCount} service
                    {keptCount > 1 ? "s" : ""} · maj {formatDate(c.updatedAt)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-semibold text-ink">{formatMoney(total, c.currency)}</div>
                  <div className="text-xs text-ink-subtle">total actuel</div>
                </div>
              </Link>
            );
          })}
        </Card>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "amber" | "green";
}) {
  const color =
    accent === "amber"
      ? "text-amber-600"
      : accent === "green"
        ? "text-green-600"
        : "text-brand-600";
  return (
    <Card className="p-4">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="mt-1 text-xs text-ink-muted">{label}</div>
    </Card>
  );
}
