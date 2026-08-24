import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";
import { generateQuotePdf } from "@/lib/quote";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (!(await isAuthenticated())) {
    return new Response("Non autorisé", { status: 401 });
  }

  const checklist = await prisma.checklist.findUnique({
    where: { id: params.id },
    include: { client: true, services: { orderBy: { position: "asc" } } },
  });

  if (!checklist) {
    return new Response("Introuvable", { status: 404 });
  }

  const pdfBytes = await generateQuotePdf(checklist);
  const safeTitle = checklist.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

  return new Response(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="devis-${safeTitle}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
