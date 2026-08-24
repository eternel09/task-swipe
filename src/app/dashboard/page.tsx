import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { computeTotal, formatMoney, statusMeta, formatDate } from "@/lib/format";

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mes checklists</h1>
        <p className="mt-1 text-sm text-gray-500">
          Crée une checklist par client, partage le lien, reçois ses réponses et génère le devis.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="En attente de réponse / répondues" value={stats.responded} accent="amber" />
        <StatCard label="Devis finalisés" value={stats.finalized} accent="green" />
      </div>

      {checklists.length === 0 ? (
        <div className="card flex flex-col items-center justify-center gap-3 p-12 text-center">
          <p className="text-gray-500">Aucune checklist pour l'instant.</p>
          <Link href="/dashboard/checklists/new" className="btn-primary">
            + Créer ma première checklist
          </Link>
        </div>
      ) : (
        <div className="card divide-y divide-gray-100">
          {checklists.map((c) => {
            const meta = statusMeta(c.status);
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
                    <span className="truncate font-semibold">{c.title}</span>
                    <span className={`badge ${meta.className}`}>{meta.label}</span>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-gray-500">
                    {c.client.company || c.client.name} · {keptCount} service
                    {keptCount > 1 ? "s" : ""} · maj {formatDate(c.updatedAt)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-semibold">{formatMoney(total, c.currency)}</div>
                  <div className="text-xs text-gray-400">total actuel</div>
                </div>
              </Link>
            );
          })}
        </div>
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
    <div className="card p-4">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="mt-1 text-xs text-gray-500">{label}</div>
    </div>
  );
}
