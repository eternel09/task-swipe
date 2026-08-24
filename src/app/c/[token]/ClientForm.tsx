"use client";

import { useState, useTransition } from "react";
import { submitResponse } from "@/lib/public-actions";

type AdminSvc = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  keep: boolean;
  proposedPrice: number | null;
};
type AddedRow = { name: string; description: string; price: string };

function money(n: number, currency: string) {
  const parts = n.toFixed(2).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${parts.join(".")} ${currency}`;
}

export default function ClientForm({
  token,
  currency,
  alreadyResponded,
  previousMessage,
  adminServices,
  clientServices,
}: {
  token: string;
  currency: string;
  alreadyResponded: boolean;
  previousMessage: string;
  adminServices: AdminSvc[];
  clientServices: { name: string; description: string | null; price: number }[];
}) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState(
    adminServices.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      price: s.price,
      keep: s.keep,
      counter:
        s.proposedPrice != null && s.proposedPrice !== s.price ? String(s.proposedPrice) : "",
    }))
  );

  const [added, setAdded] = useState<AddedRow[]>(
    clientServices.length
      ? clientServices.map((s) => ({
          name: s.name,
          description: s.description ?? "",
          price: String(s.price),
        }))
      : []
  );
  const [message, setMessage] = useState(previousMessage);

  const setItem = (id: string, patch: Partial<{ keep: boolean; counter: string }>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const addRow = () => setAdded((prev) => [...prev, { name: "", description: "", price: "" }]);
  const updateAdded = (i: number, patch: Partial<AddedRow>) =>
    setAdded((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const removeAdded = (i: number) => setAdded((prev) => prev.filter((_, idx) => idx !== i));

  const estimate =
    items
      .filter((it) => it.keep)
      .reduce((sum, it) => sum + (it.counter !== "" ? parseFloat(it.counter) || 0 : it.price), 0) +
    added.reduce((sum, r) => sum + (parseFloat(r.price) || 0), 0);

  const submit = () => {
    setError(null);
    const cleanedAdded = added
      .filter((r) => r.name.trim())
      .map((r) => ({
        name: r.name.trim(),
        description: r.description.trim() || null,
        price: parseFloat(r.price) || 0,
      }));

    startTransition(async () => {
      const res = await submitResponse({
        token,
        message: message.trim() || null,
        items: items.map((it) => ({
          serviceId: it.id,
          keep: it.keep,
          proposedPrice: it.counter !== "" ? parseFloat(it.counter) || 0 : null,
        })),
        added: cleanedAdded,
      });
      if (res.ok) setDone(true);
      else setError(res.error);
    });
  };

  if (done) {
    return (
      <div className="mt-6 card border-green-200 bg-green-50 p-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-2xl text-white">
          ✓
        </div>
        <h2 className="text-lg font-bold text-green-800">Merci, c'est envoyé !</h2>
        <p className="mt-2 text-sm text-green-700">
          Vos choix ont bien été transmis au prestataire. Il vous fera parvenir le devis final.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {alreadyResponded && (
        <div className="card border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Vous avez déjà répondu. Vous pouvez modifier vos choix et renvoyer.
        </div>
      )}

      <div className="card p-5">
        <h2 className="mb-1 font-semibold">Services proposés</h2>
        <p className="mb-4 text-sm text-gray-500">
          Décochez ceux dont vous n'avez pas besoin. Vous pouvez aussi proposer votre propre prix.
        </p>
        <div className="space-y-3">
          {items.map((it) => (
            <div
              key={it.id}
              className={`rounded-lg border p-3 transition ${
                it.keep ? "border-brand-200 bg-brand-50/40" : "border-gray-200 bg-gray-50 opacity-70"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 accent-brand-600"
                  checked={it.keep}
                  onChange={(e) => setItem(it.id, { keep: e.target.checked })}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{it.name}</span>
                    <span className="text-sm text-gray-500">{money(it.price, currency)}</span>
                  </div>
                  {it.description && (
                    <p className="mt-0.5 text-sm text-gray-500">{it.description}</p>
                  )}
                  {it.keep && (
                    <div className="mt-2 flex items-center gap-2">
                      <label className="text-xs text-gray-500">Votre prix (optionnel) :</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="input w-28 py-1 text-sm"
                        value={it.counter}
                        placeholder={String(it.price)}
                        onChange={(e) => setItem(it.id, { counter: e.target.value })}
                      />
                      <span className="text-xs text-gray-400">{currency}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="mb-1 font-semibold">Ajouter un service</h2>
        <p className="mb-4 text-sm text-gray-500">
          Un besoin non listé ? Ajoutez-le avec le prix que vous proposez.
        </p>
        <div className="space-y-3">
          {added.map((r, i) => (
            <div key={i} className="flex gap-3 rounded-lg border border-gray-200 p-3">
              <div className="flex-1 space-y-2">
                <input
                  className="input"
                  value={r.name}
                  onChange={(e) => updateAdded(i, { name: e.target.value })}
                  placeholder="Nom du service"
                />
                <input
                  className="input"
                  value={r.description}
                  onChange={(e) => updateAdded(i, { description: e.target.value })}
                  placeholder="Description (optionnel)"
                />
              </div>
              <div className="w-28">
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={r.price}
                  onChange={(e) => updateAdded(i, { price: e.target.value })}
                  placeholder="0.00"
                />
                <button
                  type="button"
                  onClick={() => removeAdded(i)}
                  className="mt-2 w-full text-xs text-red-500 hover:underline"
                >
                  Retirer
                </button>
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={addRow} className="btn-secondary mt-3">
          + Ajouter un service
        </button>
      </div>

      <div className="card p-5">
        <label className="label">Un message pour le prestataire (optionnel)</label>
        <textarea
          className="input"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Précisions, délais souhaités, budget…"
        />
      </div>

      <div className="card sticky bottom-4 flex items-center justify-between p-4 shadow-lg">
        <div>
          <div className="text-xs text-gray-500">Estimation</div>
          <div className="text-lg font-bold text-brand-700">{money(estimate, currency)}</div>
        </div>
        <button type="button" onClick={submit} className="btn-primary" disabled={pending}>
          {pending ? "Envoi…" : "Confirmer et envoyer"}
        </button>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
