"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { nanoid } from "nanoid";
import { z } from "zod";
import { prisma } from "./prisma";
import { isAuthenticated } from "./auth";

async function assertAuth() {
  if (!(await isAuthenticated())) {
    throw new Error("Non autorisé");
  }
}

const serviceInput = z.object({
  name: z.string().trim().min(1, "Nom requis"),
  description: z.string().trim().optional().nullable(),
  price: z.number().nonnegative(),
});

const createSchema = z.object({
  client: z.object({
    name: z.string().trim().min(1, "Nom du client requis"),
    email: z.string().trim().optional().nullable(),
    phone: z.string().trim().optional().nullable(),
    company: z.string().trim().optional().nullable(),
    existingId: z.string().trim().optional().nullable(),
  }),
  title: z.string().trim().min(1, "Titre requis"),
  description: z.string().trim().optional().nullable(),
  currency: z.string().trim().min(1).max(6).default("$"),
  services: z.array(serviceInput).min(1, "Ajoute au moins un service"),
});

export type CreateInput = z.infer<typeof createSchema>;

export async function createChecklist(raw: CreateInput) {
  await assertAuth();
  const data = createSchema.parse(raw);

  let clientId = data.client.existingId || null;
  if (!clientId) {
    const client = await prisma.client.create({
      data: {
        name: data.client.name,
        email: data.client.email || null,
        phone: data.client.phone || null,
        company: data.client.company || null,
      },
    });
    clientId = client.id;
  }

  const checklist = await prisma.checklist.create({
    data: {
      title: data.title,
      description: data.description || null,
      currency: data.currency || "$",
      status: "DRAFT",
      shareToken: nanoid(12),
      clientId,
      services: {
        create: data.services.map((s, i) => ({
          name: s.name,
          description: s.description || null,
          price: s.price,
          position: i,
          origin: "ADMIN",
          decision: "KEPT",
        })),
      },
    },
  });

  revalidatePath("/dashboard");
  redirect(`/dashboard/checklists/${checklist.id}`);
}

const saveServicesSchema = z.object({
  checklistId: z.string(),
  title: z.string().trim().min(1),
  description: z.string().trim().optional().nullable(),
  currency: z.string().trim().min(1).max(6),
  services: z.array(serviceInput),
});

/** Remplace les services (autorisé tant que le client n'a pas répondu). */
export async function saveServices(raw: z.infer<typeof saveServicesSchema>) {
  await assertAuth();
  const data = saveServicesSchema.parse(raw);

  const checklist = await prisma.checklist.findUnique({
    where: { id: data.checklistId },
  });
  if (!checklist) throw new Error("Checklist introuvable");
  if (checklist.status === "RESPONDED" || checklist.status === "FINALIZED") {
    throw new Error("Impossible de modifier les services après réponse du client.");
  }

  await prisma.$transaction([
    prisma.service.deleteMany({ where: { checklistId: data.checklistId } }),
    prisma.checklist.update({
      where: { id: data.checklistId },
      data: {
        title: data.title,
        description: data.description || null,
        currency: data.currency,
        services: {
          create: data.services.map((s, i) => ({
            name: s.name,
            description: s.description || null,
            price: s.price,
            position: i,
            origin: "ADMIN",
            decision: "KEPT",
          })),
        },
      },
    }),
  ]);

  revalidatePath(`/dashboard/checklists/${data.checklistId}`);
  revalidatePath("/dashboard");
}

export async function markAsSent(checklistId: string) {
  await assertAuth();
  const checklist = await prisma.checklist.findUnique({ where: { id: checklistId } });
  if (!checklist) throw new Error("Checklist introuvable");
  if (checklist.status === "DRAFT") {
    await prisma.checklist.update({
      where: { id: checklistId },
      data: { status: "SENT" },
    });
  }
  revalidatePath(`/dashboard/checklists/${checklistId}`);
  revalidatePath("/dashboard");
}

const finalizeSchema = z.object({
  checklistId: z.string(),
  items: z.array(
    z.object({
      id: z.string(),
      include: z.boolean(),
      finalPrice: z.number().nonnegative().nullable(),
    })
  ),
});

export async function applyFinalization(raw: z.infer<typeof finalizeSchema>) {
  await assertAuth();
  const data = finalizeSchema.parse(raw);

  await prisma.$transaction([
    ...data.items.map((item) =>
      prisma.service.update({
        where: { id: item.id },
        data: {
          decision: item.include ? "KEPT" : "REMOVED",
          finalPrice: item.finalPrice,
        },
      })
    ),
    prisma.checklist.update({
      where: { id: data.checklistId },
      data: { status: "FINALIZED", finalizedAt: new Date() },
    }),
  ]);

  revalidatePath(`/dashboard/checklists/${data.checklistId}`);
  revalidatePath("/dashboard");
}

export async function reopenChecklist(checklistId: string) {
  await assertAuth();
  const checklist = await prisma.checklist.findUnique({ where: { id: checklistId } });
  if (!checklist) throw new Error("Checklist introuvable");
  const next = checklist.respondedAt ? "RESPONDED" : "SENT";
  await prisma.checklist.update({
    where: { id: checklistId },
    data: { status: next, finalizedAt: null },
  });
  revalidatePath(`/dashboard/checklists/${checklistId}`);
  revalidatePath("/dashboard");
}

export async function deleteChecklist(checklistId: string) {
  await assertAuth();
  await prisma.checklist.delete({ where: { id: checklistId } });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
