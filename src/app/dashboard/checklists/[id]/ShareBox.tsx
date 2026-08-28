"use client";

import { useState } from "react";
import { Button, Card, CardHeader, CardTitle, CardBody, Input } from "@/components/ui";

export default function ShareBox({
  shareUrl,
  clientPhone,
  title,
}: {
  shareUrl: string;
  clientPhone: string | null;
  title: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const waText = encodeURIComponent(
    `Bonjour, voici la liste des services pour "${title}". ` +
      `Merci de cocher/décocher ceux dont vous avez besoin et de confirmer :\n${shareUrl}`
  );
  const waHref = clientPhone
    ? `https://wa.me/${clientPhone.replace(/[^0-9]/g, "")}?text=${waText}`
    : `https://wa.me/?text=${waText}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lien à partager au client</CardTitle>
        <p className="mt-1 text-sm text-ink-muted">
          Le client ouvre ce lien, sélectionne ses services, propose un prix et confirme.
        </p>
      </CardHeader>
      <CardBody className="flex flex-col gap-2 sm:flex-row">
        <Input readOnly value={shareUrl} className="font-mono text-xs" />
        <Button onClick={copy} type="button" variant="secondary" className="shrink-0">
          {copied ? "Copié ✓" : "Copier"}
        </Button>
        <a href={waHref} target="_blank" rel="noopener noreferrer" className="shrink-0">
          <Button type="button" variant="success" className="w-full">
            Envoyer via WhatsApp
          </Button>
        </a>
      </CardBody>
    </Card>
  );
}
