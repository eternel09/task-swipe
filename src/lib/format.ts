export function formatMoney(amount: number, currency = "$"): string {
  const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
  const str = rounded.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${str} ${currency}`;
}

/** Prix effectif d'un service pour le calcul du total / devis. */
export function effectivePrice(service: {
  price: number;
  proposedPrice: number | null;
  finalPrice: number | null;
}): number {
  if (service.finalPrice !== null && service.finalPrice !== undefined) {
    return service.finalPrice;
  }
  if (service.proposedPrice !== null && service.proposedPrice !== undefined) {
    return service.proposedPrice;
  }
  return service.price;
}

export function computeTotal(
  services: {
    decision: string;
    price: number;
    proposedPrice: number | null;
    finalPrice: number | null;
  }[]
): number {
  return services
    .filter((s) => s.decision === "KEPT")
    .reduce((sum, s) => sum + effectivePrice(s), 0);
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Brouillon", className: "bg-gray-100 text-gray-700" },
  SENT: { label: "Envoyée", className: "bg-blue-100 text-blue-700" },
  RESPONDED: { label: "Répondue", className: "bg-amber-100 text-amber-800" },
  FINALIZED: { label: "Finalisée", className: "bg-green-100 text-green-700" },
};

export function statusMeta(status: string) {
  return STATUS_LABELS[status] ?? STATUS_LABELS.DRAFT;
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
