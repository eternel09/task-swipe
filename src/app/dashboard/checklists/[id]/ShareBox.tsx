"use client";

import { useState } from "react";

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
    <div className="card p-5">
      <h2 className="mb-1 font-semibold">Lien à partager au client</h2>
      <p className="mb-3 text-sm text-gray-500">
        Le client ouvre ce lien, sélectionne ses services, propose un prix et confirme.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input readOnly value={shareUrl} className="input font-mono text-xs" />
        <button onClick={copy} type="button" className="btn-secondary shrink-0">
          {copied ? "Copié ✓" : "Copier"}
        </button>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="btn shrink-0 bg-green-600 text-white hover:bg-green-700"
        >
          Envoyer via WhatsApp
        </a>
      </div>
    </div>
  );
}
