"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui";
import { deleteChecklist } from "@/lib/actions";

export default function DeleteButton({ checklistId }: { checklistId: string }) {
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    if (!confirm("Supprimer définitivement cette checklist ?")) return;
    startTransition(async () => {
      try {
        await deleteChecklist(checklistId);
      } catch (err: any) {
        if (err?.message === "NEXT_REDIRECT") throw err;
        alert(err?.message ?? "Erreur");
      }
    });
  };

  return (
    <Button type="button" variant="danger" onClick={onClick} loading={pending}>
      Supprimer
    </Button>
  );
}
