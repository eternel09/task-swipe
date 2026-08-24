"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "./prisma";

const submitSchema = z.object({
  token: z.string(),
  message: z.string().trim().max(2000).optional().nullable(),
  items: z.array(
    z.object({
      serviceId: z.string(),
      keep: z.boolean(),
      proposedPrice: z.number().nonnegative().nullable(),
    })
  ),
  added: z.array(
    z.object({
      name: z.string().trim().min(1),
      description: z.string().trim().optional().nullable(),
      price: z.number().nonnegative(),
    })
  ),
});

export type SubmitResult = { ok: true } | { ok: false; error: string };

export async function submitResponse(
  raw: z.infer<typeof submitSchema>
): Promise<SubmitResult> {
  const parsed = submitSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Données invalides." };
  }
  const data = parsed.data;

  const checklist = await prisma.checklist.findUnique({
    where: { shareToken: data.token },
    include: { services: true },
  });

  if (!checklist) return { ok: false, error: "Lien introuvable." };
  if (checklist.status === "FINALIZED") {
    return { ok: false, error: "Ce devis a déjà été finalisé par le prestataire." };
  }

  const adminServiceIds = new Set(
    checklist.services.filter((s) => s.origin === "ADMIN").map((s) => s.id)
  );

  await prisma.$transaction(async (tx) => {
    // Met à jour les décisions sur les services existants (admin)
    for (const item of data.items) {
      if (!adminServiceIds.has(item.serviceId)) continue;
      await tx.service.update({
        where: { id: item.serviceId },
        data: {
          decision: item.keep ? "KEPT" : "REMOVED",
          proposedPrice: item.proposedPrice,
        },
      });
    }

    // Supprime les anciens services ajoutés par le client (en cas de re-soumission)
    await tx.service.deleteMany({
      where: { checklistId: checklist.id, origin: "CLIENT" },
    });

    // Recrée les services ajoutés par le client
    if (data.added.length > 0) {
      let pos = checklist.services.length;
      for (const a of data.added) {
        await tx.service.create({
          data: {
            checklistId: checklist.id,
            name: a.name,
            description: a.description || null,
            price: a.price,
            proposedPrice: a.price,
            position: pos++,
            origin: "CLIENT",
            decision: "KEPT",
          },
        });
      }
    }

    await tx.checklist.update({
      where: { id: checklist.id },
      data: {
        status: "RESPONDED",
        clientMessage: data.message || null,
        respondedAt: new Date(),
      },
    });
  });

  revalidatePath(`/dashboard/checklists/${checklist.id}`);
  revalidatePath("/dashboard");
  return { ok: true };
}
