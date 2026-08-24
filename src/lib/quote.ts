import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from "pdf-lib";
import { effectivePrice, computeTotal } from "./format";

type ServiceLike = {
  name: string;
  description: string | null;
  price: number;
  proposedPrice: number | null;
  finalPrice: number | null;
  decision: string;
  origin: string;
};

type ChecklistLike = {
  title: string;
  currency: string;
  createdAt: Date;
  client: { name: string; email: string | null; phone: string | null; company: string | null };
  services: ServiceLike[];
};

const BRAND = rgb(0.31, 0.27, 0.9); // indigo
const DARK = rgb(0.12, 0.13, 0.18);
const GRAY = rgb(0.45, 0.47, 0.53);
const LIGHT = rgb(0.9, 0.91, 0.94);

function money(amount: number, currency: string): string {
  const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
  // toLocaleString peut ne pas être fiable côté Node pour certaines locales; format manuel simple.
  const parts = rounded.toFixed(2).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${parts.join(".")} ${currency}`;
}

export async function generateQuotePdf(checklist: ChecklistLike): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let page = pdf.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const margin = 50;
  let y = height - margin;

  const draw = (
    text: string,
    x: number,
    yy: number,
    opts: { font?: PDFFont; size?: number; color?: ReturnType<typeof rgb> } = {}
  ) => {
    page.drawText(text ?? "", {
      x,
      y: yy,
      size: opts.size ?? 10,
      font: opts.font ?? font,
      color: opts.color ?? DARK,
    });
  };

  // En-tête
  page.drawRectangle({ x: 0, y: height - 8, width, height: 8, color: BRAND });
  draw("DEVIS", margin, y, { font: bold, size: 26, color: BRAND });
  const dateStr = checklist.createdAt.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  draw(`Date : ${dateStr}`, width - margin - 160, y - 2, { size: 10, color: GRAY });
  y -= 24;
  draw(checklist.title, margin, y, { font: bold, size: 12, color: DARK });
  y -= 30;

  // Bloc client
  draw("DESTINATAIRE", margin, y, { font: bold, size: 9, color: GRAY });
  y -= 16;
  draw(checklist.client.company || checklist.client.name, margin, y, { font: bold, size: 11 });
  y -= 14;
  if (checklist.client.company && checklist.client.name) {
    draw(checklist.client.name, margin, y, { size: 10, color: GRAY });
    y -= 14;
  }
  const contact = [checklist.client.email, checklist.client.phone].filter(Boolean).join("  •  ");
  if (contact) {
    draw(contact, margin, y, { size: 10, color: GRAY });
    y -= 14;
  }
  y -= 14;

  // En-tête de tableau
  const colName = margin;
  const colPrice = width - margin - 90;
  const drawTableHeader = () => {
    page.drawRectangle({
      x: margin - 6,
      y: y - 6,
      width: width - 2 * margin + 12,
      height: 22,
      color: rgb(0.95, 0.96, 0.98),
    });
    draw("PRESTATION", colName, y, { font: bold, size: 9, color: GRAY });
    draw("MONTANT", colPrice, y, { font: bold, size: 9, color: GRAY });
    y -= 24;
  };
  drawTableHeader();

  const kept = checklist.services
    .filter((s) => s.decision === "KEPT")
    .sort((a, b) => a.name.localeCompare(b.name));

  const wrap = (text: string, maxWidth: number, size: number, f: PDFFont): string[] => {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let current = "";
    for (const w of words) {
      const test = current ? `${current} ${w}` : w;
      if (f.widthOfTextAtSize(test, size) > maxWidth && current) {
        lines.push(current);
        current = w;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  };

  for (const s of kept) {
    if (y < 140) {
      page = pdf.addPage([595.28, 841.89]);
      y = height - margin;
      drawTableHeader();
    }
    const priceStr = money(effectivePrice(s), checklist.currency);
    draw(s.name, colName, y, { font: bold, size: 10 });
    draw(priceStr, colPrice, y, { size: 10 });
    if (s.origin === "CLIENT") {
      const tagX = colName + bold.widthOfTextAtSize(s.name, 10) + 8;
      draw("(ajouté par le client)", tagX, y + 1, { size: 8, color: BRAND });
    }
    y -= 14;
    if (s.description) {
      for (const line of wrap(s.description, colPrice - colName - 20, 9, font)) {
        draw(line, colName, y, { size: 9, color: GRAY });
        y -= 12;
      }
    }
    y -= 6;
    page.drawLine({
      start: { x: margin - 6, y: y + 2 },
      end: { x: width - margin + 6, y: y + 2 },
      thickness: 0.5,
      color: LIGHT,
    });
    y -= 8;
  }

  // Total
  const total = computeTotal(checklist.services);
  y -= 6;
  page.drawRectangle({
    x: colPrice - 120,
    y: y - 8,
    width: width - margin - (colPrice - 120) + 6,
    height: 28,
    color: BRAND,
  });
  draw("TOTAL", colPrice - 110, y, { font: bold, size: 11, color: rgb(1, 1, 1) });
  draw(money(total, checklist.currency), colPrice - 30, y, {
    font: bold,
    size: 11,
    color: rgb(1, 1, 1),
  });
  y -= 44;

  // Pied de page
  draw(
    "Devis généré via Checklist. Prix indicatifs, sous réserve d'acceptation finale.",
    margin,
    40,
    { size: 8, color: GRAY }
  );

  return pdf.save();
}
