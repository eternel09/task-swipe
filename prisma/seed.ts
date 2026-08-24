import { PrismaClient } from "@prisma/client";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.checklist.count();
  if (existing > 0) {
    console.log("Des données existent déjà, seed ignoré.");
    return;
  }

  const client = await prisma.client.create({
    data: {
      name: "Client Démo",
      email: "client@exemple.com",
      phone: "243900000000",
      company: "Exemple SARL",
    },
  });

  await prisma.checklist.create({
    data: {
      title: "Refonte site web + branding",
      description: "Prestations proposées pour le projet de refonte.",
      currency: "$",
      status: "SENT",
      shareToken: nanoid(12),
      clientId: client.id,
      services: {
        create: [
          { name: "Maquette UI/UX", description: "Design des écrans clés", price: 800, position: 0 },
          { name: "Développement front-end", description: "Intégration responsive", price: 1500, position: 1 },
          { name: "Logo & identité visuelle", description: "Logo + charte", price: 400, position: 2 },
          { name: "Hébergement & mise en ligne", description: "Configuration serveur", price: 200, position: 3 },
        ],
      },
    },
  });

  console.log("Seed terminé ✔");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
