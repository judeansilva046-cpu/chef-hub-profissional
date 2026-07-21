"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";

import { conciliarTransacao } from "../erp/actions";

export function ConciliarButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await conciliarTransacao(id);
        })
      }
    >
      {pending ? "…" : "Conciliar"}
    </Button>
  );
}
