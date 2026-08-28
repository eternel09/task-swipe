"use client";

import { useState, useTransition } from "react";
import { Button, Card, CardBody, CardHeader, CardTitle, Input, Field, Badge, Switch } from "@/components/ui";
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

  const keptCount =
    items.filter((it) => it.keep).length + added.filter((r) => r.name.trim()).length;
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
      if (res.ok) {
        setDone(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else setError(res.error);
    });
  };

  if (done) {
    return (
      <Card className="animate-fade-in p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-3xl text-white">
          ✓
        </div>
        <h2 className="text-xl font-bold text-ink">Merci, c'est envoyé !</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
          Vos choix ont bien été transmis au prestataire. Il reviendra vers vous avec le devis
          final. Vous pouvez fermer cette page.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-50 px-4 py-2 text-sm text-brand-700">
          <span>Total estimé transmis :</span>
          <strong>{money(estimate, currency)}</strong>
        </div>
      </Card>
    );
  }

  return (
    <div className="animate-fade-in space-y-4">
      {alreadyResponded && (
        <Card className="border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-800">
            Vous avez déjà répondu. Vous pouvez ajuster vos choix et renvoyer.
          </p>
        </Card>
      )}

      {/* Services proposés */}
      <Card>
        <CardHeader>
          <CardTitle>Services proposés</CardTitle>
          <p className="mt-1 text-sm text-ink-muted">
            Activez ce dont vous avez besoin. Vous pouvez proposer votre propre prix.
          </p>
        </CardHeader>
        <div className="divide-y divide-gray-100">
          {items.map((it) => (
            <div
              key={it.id}
              className={`px-5 py-4 transition ${it.keep ? "" : "bg-gray-50/70"}`}
            >
              <div className="flex items-start gap-3">
                <div className="pt-0.5">
                  <Switch
                    checked={it.keep}
                    onChange={(v) => setItem(it.id, { keep: v })}
                    label={`Inclure ${it.name}`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`font-medium ${it.keep ? "text-ink" : "text-ink-muted line-through"}`}
                    >
                      {it.name}
                    </span>
                    <span
                      className={`shrink-0 text-sm ${it.keep ? "text-ink" : "text-ink-subtle"}`}
                    >
                      {money(it.price, currency)}
                    </span>
                  </div>
                  {it.description && (
                    <p className="mt-0.5 text-sm text-ink-muted">{it.description}</p>
                  )}
                  {!it.keep && (
                    <div className="mt-1">
                      <Badge tone="red">Retiré</Badge>
                    </div>
                  )}
                  {it.keep && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <label className="text-xs text-ink-muted">
                        Proposer un autre prix :
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        className="h-9 w-28 py-1 text-sm"
                        value={it.counter}
                        placeholder={String(it.price)}
                        onChange={(e) => setItem(it.id, { counter: e.target.value })}
                      />
                      <span className="text-xs text-ink-subtle">{currency}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Ajouter un service */}
      <Card>
        <CardHeader>
          <CardTitle>Un besoin en plus ?</CardTitle>
          <p className="mt-1 text-sm text-ink-muted">
            Ajoutez un service non listé avec le prix que vous proposez.
          </p>
        </CardHeader>
        <CardBody className="space-y-3">
          {added.map((r, i) => (
            <div key={i} className="flex gap-3 rounded-xl border border-gray-200 p-3">
              <div className="flex-1 space-y-2">
                <Input
                  value={r.name}
                  onChange={(e) => updateAdded(i, { name: e.target.value })}
                  placeholder="Nom du service"
                />
                <Input
                  value={r.description}
                  onChange={(e) => updateAdded(i, { description: e.target.value })}
                  placeholder="Description (optionnel)"
                />
              </div>
              <div className="w-28 shrink-0">
                <Input
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
          <Button type="button" variant="secondary" onClick={addRow}>
            + Ajouter un service
          </Button>
        </CardBody>
      </Card>

      {/* Message */}
      <Card>
        <CardBody>
          <Field label="Un message pour le prestataire (optionnel)">
            <textarea
              className="w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-ink shadow-sm outline-none transition placeholder:text-ink-subtle focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Précisions, délais souhaités, budget…"
            />
          </Field>
        </CardBody>
      </Card>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {/* Barre de résumé fixe */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <div className="text-xs text-ink-muted">
              {keptCount} service{keptCount > 1 ? "s" : ""} · estimation
            </div>
            <div className="text-lg font-bold text-brand-700">{money(estimate, currency)}</div>
          </div>
          <Button type="button" size="lg" onClick={submit} loading={pending}>
            {pending ? "Envoi…" : "Confirmer et envoyer"}
          </Button>
        </div>
      </div>
    </div>
  );
}
