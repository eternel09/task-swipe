"use client";

import { useState, useTransition } from "react";
import { createChecklist } from "@/lib/actions";

type ClientOption = { id: string; name: string; company: string | null };
type ServiceRow = { name: string; description: string; price: string };

export default function NewChecklistForm({ clients }: { clients: ClientOption[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [existingId, setExistingId] = useState<string>("");
  const [client, setClient] = useState({ name: "", email: "", phone: "", company: "" });
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState("$");
  const [services, setServices] = useState<ServiceRow[]>([
    { name: "", description: "", price: "" },
  ]);

  const updateService = (i: number, patch: Partial<ServiceRow>) => {
    setServices((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  };
  const addRow = () =>
    setServices((prev) => [...prev, { name: "", description: "", price: "" }]);
  const removeRow = (i: number) =>
    setServices((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));

  const total = services.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!existingId && !client.name.trim()) {
      setError("Renseigne le nom du client (ou choisis un client existant).");
      return;
    }
    if (!title.trim()) {
      setError("Donne un titre à la checklist.");
      return;
    }
    const cleaned = services
      .filter((s) => s.name.trim())
      .map((s) => ({
        name: s.name.trim(),
        description: s.description.trim() || null,
        price: parseFloat(s.price) || 0,
      }));
    if (cleaned.length === 0) {
      setError("Ajoute au moins un service avec un nom.");
      return;
    }

    startTransition(async () => {
      try {
        await createChecklist({
          client: {
            existingId: existingId || null,
            name: client.name.trim(),
            email: client.email.trim() || null,
            phone: client.phone.trim() || null,
            company: client.company.trim() || null,
          },
          title: title.trim(),
          description: description.trim() || null,
          currency: currency.trim() || "$",
          services: cleaned,
        });
      } catch (err: any) {
        if (err?.message === "NEXT_REDIRECT") throw err;
        setError(err?.message ?? "Une erreur est survenue.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Client */}
      <section className="card p-5">
        <h2 className="mb-4 font-semibold">Client</h2>
        {clients.length > 0 && (
          <div className="mb-4">
            <label className="label">Client existant</label>
            <select
              className="input"
              value={existingId}
              onChange={(e) => setExistingId(e.target.value)}
            >
              <option value="">— Nouveau client —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company ? `${c.company} (${c.name})` : c.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {!existingId && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Nom du client *</label>
              <input
                className="input"
                value={client.name}
                onChange={(e) => setClient({ ...client, name: e.target.value })}
                placeholder="Jean Dupont"
              />
            </div>
            <div>
              <label className="label">Société</label>
              <input
                className="input"
                value={client.company}
                onChange={(e) => setClient({ ...client, company: e.target.value })}
                placeholder="Acme SARL"
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                value={client.email}
                onChange={(e) => setClient({ ...client, email: e.target.value })}
                placeholder="client@exemple.com"
              />
            </div>
            <div>
              <label className="label">Téléphone (WhatsApp)</label>
              <input
                className="input"
                value={client.phone}
                onChange={(e) => setClient({ ...client, phone: e.target.value })}
                placeholder="243900000000"
              />
            </div>
          </div>
        )}
      </section>

      {/* Détails */}
      <section className="card p-5">
        <h2 className="mb-4 font-semibold">Checklist</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="label">Titre *</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Refonte site web + branding"
            />
          </div>
          <div>
            <label className="label">Devise</label>
            <input
              className="input"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              placeholder="$"
              maxLength={6}
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="label">Description (optionnel)</label>
          <textarea
            className="input"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Contexte du projet, conditions…"
          />
        </div>
      </section>

      {/* Services */}
      <section className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Services proposés</h2>
          <span className="text-sm text-gray-500">
            Total : <strong>{total.toFixed(2)} {currency}</strong>
          </span>
        </div>
        <div className="space-y-3">
          {services.map((s, i) => (
            <div key={i} className="rounded-lg border border-gray-200 p-3">
              <div className="flex gap-3">
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
                  <div className="flex items-center gap-1">
                    <input
                      className="input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={s.price}
                      onChange={(e) => updateService(i, { price: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="mt-2 w-full text-xs text-red-500 hover:underline"
                  >
                    Retirer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={addRow} className="btn-secondary mt-3">
          + Ajouter un service
        </button>
      </section>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      <div className="flex justify-end gap-3">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Création…" : "Créer la checklist"}
        </button>
      </div>
    </form>
  );
}
