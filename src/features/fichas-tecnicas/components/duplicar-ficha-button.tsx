"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Copy } from "lucide-react";

import { Button } from "@/components/ui/button";

import { duplicarFichaTecnica } from "../actions";

export function DuplicarFichaButton({ fichaId }: { fichaId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          try {
            const novaId = await duplicarFichaTecnica(fichaId);
            router.push(`/fichas-tecnicas/${novaId}`);
          } catch (error) {
            window.alert(
              error instanceof Error
                ? error.message
                : "Não foi possível duplicar a ficha técnica.",
            );
          }
        });
      }}
    >
      <Copy className="h-4 w-4" />
      {pending ? "Duplicando..." : "Duplicar"}
    </Button>
  );
}
