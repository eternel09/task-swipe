import { cn } from "@/lib/cn";

type Tone = "gray" | "brand" | "blue" | "amber" | "green" | "red";

const TONES: Record<Tone, string> = {
  gray: "bg-gray-100 text-gray-700",
  brand: "bg-brand-100 text-brand-700",
  blue: "bg-blue-100 text-blue-700",
  amber: "bg-amber-100 text-amber-800",
  green: "bg-green-100 text-green-700",
  red: "bg-red-100 text-red-700",
};

export function Badge({
  tone = "gray",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        TONES[tone],
        className
      )}
      {...props}
    />
  );
}

/** Correspondance statut de checklist -> libellé + ton. */
const STATUS: Record<string, { label: string; tone: Tone }> = {
  DRAFT: { label: "Brouillon", tone: "gray" },
  SENT: { label: "Envoyée", tone: "blue" },
  RESPONDED: { label: "Répondue", tone: "amber" },
  FINALIZED: { label: "Finalisée", tone: "green" },
};

export function StatusBadge({ status }: { status: string }) {
  const meta = STATUS[status] ?? STATUS.DRAFT;
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
