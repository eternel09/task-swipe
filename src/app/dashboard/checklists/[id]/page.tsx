import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney, computeTotal } from "@/lib/format";
import { Card, CardBody, StatusBadge } from "@/components/ui";
import ShareBox from "./ShareBox";
import ServicesEditor from "./ServicesEditor";
import FinalizePanel from "./FinalizePanel";
import DeleteButton from "./DeleteButton";

export const dynamic = "force-dynamic";

export default async function ChecklistDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const checklist = await prisma.checklist.findUnique({
    where: { id: params.id },
    include: { client: true, services: { orderBy: { position: "asc" } } },
  });

  if (!checklist) notFound();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const shareUrl = `${appUrl}/c/${checklist.shareToken}`;
  const total = computeTotal(checklist.services);
  const beforeResponse = checklist.status === "DRAFT" || checklist.status === "SENT";

  const contact = [checklist.client.email, checklist.client.phone].filter(Boolean).join(" · ");

  return (
    <div className="animate-fade-in space-y-6">
      <Link href="/dashboard" className="text-sm text-brand-600 hover:underline">
        ← Toutes les checklists
      </Link>

      {/* En-tête */}
      <Card>
        <CardBody className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-ink">{checklist.title}</h1>
              <StatusBadge status={checklist.status} />
            </div>
            <p className="mt-2 text-sm text-ink-muted">
              <span className="font-medium text-ink">
                {checklist.client.company || checklist.client.name}
              </span>
              {checklist.client.company && ` · ${checklist.client.name}`}
              {contact && ` · ${contact}`}
            </p>
            {checklist.respondedAt && (
              <p className="mt-1 text-xs text-ink-subtle">
                Réponse reçue le {formatDate(checklist.respondedAt)}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-brand-700">
              {formatMoney(total, checklist.currency)}
            </div>
            <div className="text-xs text-ink-subtle">total actuel</div>
          </div>
        </CardBody>
      </Card>

      {beforeResponse && (
        <ShareBox shareUrl={shareUrl} clientPhone={checklist.client.phone} title={checklist.title} />
      )}

      {checklist.clientMessage && (
        <Card className="border-amber-200 bg-amber-50">
          <CardBody>
            <h2 className="mb-1 text-sm font-semibold text-amber-800">Message du client</h2>
            <p className="whitespace-pre-wrap text-sm text-amber-900">{checklist.clientMessage}</p>
          </CardBody>
        </Card>
      )}

      {beforeResponse ? (
        <ServicesEditor
          checklistId={checklist.id}
          initialTitle={checklist.title}
          initialDescription={checklist.description ?? ""}
          initialCurrency={checklist.currency}
          initialServices={checklist.services.map((s) => ({
            name: s.name,
            description: s.description,
            price: s.price,
          }))}
          status={checklist.status}
        />
      ) : (
        <FinalizePanel
          checklistId={checklist.id}
          services={checklist.services.map((s) => ({
            id: s.id,
            name: s.name,
            description: s.description,
            price: s.price,
            proposedPrice: s.proposedPrice,
            finalPrice: s.finalPrice,
            decision: s.decision,
            origin: s.origin,
          }))}
          currency={checklist.currency}
          status={checklist.status}
          clientPhone={checklist.client.phone}
          title={checklist.title}
          pdfUrl={`/dashboard/checklists/${checklist.id}/pdf`}
        />
      )}

      <div className="flex justify-end">
        <DeleteButton checklistId={checklist.id} />
      </div>
    </div>
  );
}
