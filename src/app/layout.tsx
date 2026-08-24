import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Checklist — Devis clients",
  description: "Crée des checklists de services, partage-les à tes clients et génère des devis.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
