"use client";

import { useMemo, useState, useTransition } from "react";
import { applyFinalization, reopenChecklist } from "@/lib/actions";

type Svc = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  proposedPrice: number | null;
  finalPrice: number | null;
  decision: string;
  origin: string;
};

function money(n: number, currency: string) {
  const parts = n.toFixed(2).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${parts.join(".")} ${currency}`;
}

export default function FinalizePanel({
  checklistId,
  services,
  currency,
  status,
  clientPhone,
  title,
  pdfUrl,
}: {
  checklistId: string;
  services: Svc[];
  currency: string;
  status: string;
  clientPhone: string | null;
  title: string;
  pdfUrl: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState(
    services.map((s) => {
      const suggested = s.finalPrice ?? s.proposedPrice ?? s.price;
      return {
        id: s.id,
        include: s.decision === "KEPT",
        finalPriceStr: String(suggested),
      };
    })
  );

  const byId = useMemo(() => {
    const m = new Map<string, Svc>();
    services.forEach((s) => m.set(s.id, s));
    return m;
  }, [services]);

  const setItem = (id: string, patch: Partial<{ include: boolean; finalPriceStr: string }>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const total = items
    .filter((it) => it.include)
    .reduce((sum, it) => sum + (parseFloat(it.finalPriceStr) || 0), 0);

  const finalize = () => {
    setError(null);
    startTransition(async () => {
      try {
        await applyFinalization({
          checklistId,
          items: items.map((it) => ({
            id: it.id,
            include: it.include,
            finalPrice: it.finalPriceStr === "" ? null : parseFloat(it.finalPriceStr) || 0,
          })),
        });
      } catch (err: any) {
        setError(err?.message ?? "Erreur lors de la finalisation.");
      }
    });
  };

  const reopen = () => {
    setError(null);
    startTransition(async () => {
      try {
        await reopenChecklist(checklistId);
      } catch (err: any) {
        setError(err?.message ?? "Erreur.");
      }
    });
  };

  const waLines = items
    .filter((it) => it.include)
    .map((it) => {
      const s = byId.get(it.id)!;
      return `• ${s.name} : ${money(parseFloat(it.finalPriceStr) || 0, currency)}`;
    })
    .join("\n");
  const waText = encodeURIComponent(
    `Bonjour, voici votre devis pour "${title}" :\n${waLines}\n\nTOTAL : ${money(total, currency)}`
  );
  const waHref = clientPhone
    ? `https://wa.me/${clientPhone.replace(/[^0-9]/g, "")}?text=${waText}`
    : `https://wa.me/?text=${waText}`;

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">Réponses du client & finalisation</h2>
        {status === "FINALIZED" && (
          <span className="badge bg-green-100 text-green-700">Finalisé</span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-400">
              <th className="py-2 pr-2">Inclure</th>
              <th className="py-2 pr-2">Service</th>
              <th className="py-2 pr-2 text-right">Prix initial</th>
              <th className="py-2 pr-2 text-right">Prix client</th>
              <th className="py-2 pr-2 text-right">Prix final</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => {
              const s = byId.get(it.id)!;
              const clientReduced =
                s.decision === "REMOVED"
                  ? "retiré"
                  : s.proposedPrice != null && s.proposedPrice !== s.price
                    ? money(s.proposedPrice, currency)
                    : "—";
              return (
                <tr key={it.id} className="border-b border-gray-100">
                  <td className="py-3 pr-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-brand-600"
                      checked={it.include}
                      disabled={status === "FINALIZED"}
                      onChange={(e) => setItem(it.id, { include: e.target.checked })}
                    />
                  </td>
                  <td className="py-3 pr-2">
                    <div className="flex items-center gap-2 font-medium">
                      {s.name}
                      {s.origin === "CLIENT" && (
                        <span className="badge bg-brand-100 text-brand-700">ajout client</span>
                      )}
                    </div>
                    {s.description && (
                      <div className="text-xs text-gray-500">{s.description}</div>
                    )}
                  </td>
                  <td className="py-3 pr-2 text-right text-gray-500">
                    {s.origin === "CLIENT" ? "—" : money(s.price, currency)}
                  </td>
                  <td
                    className={`py-3 pr-2 text-right ${
                      s.decision === "REMOVED" ? "text-red-500" : "text-gray-700"
                    }`}
                  >
                    {clientReduced}
                  </td>
                  <td className="py-3 pr-2 text-right">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="input w-28 text-right"
                      value={it.finalPriceStr}
                      disabled={status === "FINALIZED" || !it.include}
                      onChange={(e) => setItem(it.id, { finalPriceStr: e.target.value })}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="py-3 pr-2 text-right font-semibold">
                TOTAL
              </td>
              <td className="py-3 pr-2 text-right text-lg font-bold text-brand-700">
                {money(total, currency)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
        {status !== "FINALIZED" ? (
          <button type="button" onClick={finalize} className="btn-primary" disabled={pending}>
            {pending ? "…" : "Finaliser le devis"}
          </button>
        ) : (
          <>
            <button type="button" onClick={reopen} className="btn-secondary" disabled={pending}>
              Rouvrir
            </button>
            <a href={pdfUrl} className="btn-secondary" target="_blank" rel="noopener noreferrer">
              Télécharger le PDF
            </a>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="btn bg-green-600 text-white hover:bg-green-700"
            >
              Envoyer le devis (WhatsApp)
            </a>
          </>
        )}
      </div>
      {status === "FINALIZED" && (
        <p className="mt-3 text-xs text-gray-400">
          Astuce : télécharge le PDF puis joins-le dans WhatsApp ou par email au client.
        </p>
      )}
    </div>
  );
}
