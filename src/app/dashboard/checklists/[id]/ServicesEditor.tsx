"use client";

import { useState, useTransition } from "react";
import { saveServices, markAsSent } from "@/lib/actions";

type ServiceRow = { name: string; description: string; price: string };

export default function ServicesEditor({
  checklistId,
  initialTitle,
  initialDescription,
  initialCurrency,
  initialServices,
  status,
}: {
  checklistId: string;
  initialTitle: string;
  initialDescription: string;
  initialCurrency: string;
  initialServices: { name: string; description: string | null; price: number }[];
  status: string;
}) {
  const [pending, startTransition] = useTransition();
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [currency, setCurrency] = useState(initialCurrency);
  const [services, setServices] = useState<ServiceRow[]>(
    initialServices.length
      ? initialServices.map((s) => ({
          name: s.name,
          description: s.description ?? "",
          price: String(s.price),
        }))
      : [{ name: "", description: "", price: "" }]
  );

  const updateService = (i: number, patch: Partial<ServiceRow>) =>
    setServices((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const addRow = () => setServices((prev) => [...prev, { name: "", description: "", price: "" }]);
  const removeRow = (i: number) =>
    setServices((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));

  const total = services.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0);

  const save = (thenSend: boolean) => {
    setError(null);
    setSavedMsg(null);
    const cleaned = services
      .filter((s) => s.name.trim())
      .map((s) => ({
        name: s.name.trim(),
        description: s.description.trim() || null,
        price: parseFloat(s.price) || 0,
      }));
    if (!title.trim()) return setError("Le titre est requis.");
    if (cleaned.length === 0) return setError("Ajoute au moins un service.");

    startTransition(async () => {
      try {
        await saveServices({
          checklistId,
          title: title.trim(),
          description: description.trim() || null,
          currency: currency.trim() || "$",
          services: cleaned,
        });
        if (thenSend) await markAsSent(checklistId);
        setSavedMsg(thenSend ? "Enregistré et marqué comme envoyée ✓" : "Modifications enregistrées ✓");
      } catch (err: any) {
        setError(err?.message ?? "Erreur lors de l'enregistrement.");
      }
    });
  };

  return (
    <div className="card p-5">
      <h2 className="mb-4 font-semibold">Services proposés</h2>

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="label">Titre</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="label">Devise</label>
          <input
            className="input"
            value={currency}
            maxLength={6}
            onChange={(e) => setCurrency(e.target.value)}
          />
        </div>
        <div className="sm:col-span-3">
          <label className="label">Description</label>
          <textarea
            className="input"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-3">
        {services.map((s, i) => (
          <div key={i} className="flex gap-3 rounded-lg border border-gray-200 p-3">
            <div className="flex-1 space-y-2">
              <input
                className="input"
                value={s.name}
                onChange={(e) => updateService(i, { name: e.target.value })}
                placeholder="Nom du service"
              />
              <input
                className="input"
                value={s.description}
                onChange={(e) => updateService(i, { description: e.target.value })}
                placeholder="Description (optionnel)"
              />
            </div>
            <div className="w-32">
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                value={s.price}
                onChange={(e) => updateService(i, { price: e.target.value })}
                placeholder="0.00"
              />
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="mt-2 w-full text-xs text-red-500 hover:underline"
              >
                Retirer
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <button type="button" onClick={addRow} className="btn-secondary">
          + Ajouter un service
        </button>
        <span className="text-sm text-gray-500">
          Total : <strong>{total.toFixed(2)} {currency}</strong>
        </span>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      {savedMsg && (
        <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{savedMsg}</p>
      )}

      <div className="mt-4 flex flex-wrap justify-end gap-3">
        <button type="button" onClick={() => save(false)} className="btn-secondary" disabled={pending}>
          {pending ? "…" : "Enregistrer"}
        </button>
        {status === "DRAFT" && (
          <button type="button" onClick={() => save(true)} className="btn-primary" disabled={pending}>
            {pending ? "…" : "Enregistrer & marquer envoyée"}
          </button>
        )}
      </div>
    </div>
  );
}
