"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

import { perguntarChefHubAi } from "../actions";
import { SUGESTOES_CHEFHUB_AI } from "../intents";
import type { ChefHubAiResposta } from "../types";

export function AiCopilot() {
  const [pergunta, setPergunta] = useState<string>(SUGESTOES_CHEFHUB_AI[0]!);
  const [resultado, setResultado] = useState<ChefHubAiResposta | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function perguntar(texto: string) {
    setPergunta(texto);
    setErro(null);
    startTransition(async () => {
      try {
        const r = await perguntarChefHubAi({ pergunta: texto });
        setResultado(r);
      } catch (error) {
        setErro(
          error instanceof Error ? error.message : "Falha no ChefHub AI.",
        );
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {SUGESTOES_CHEFHUB_AI.map((s) => (
          <Button
            key={s}
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => perguntar(s)}
          >
            {s}
          </Button>
        ))}
      </div>

      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          perguntar(pergunta);
        }}
      >
        <input
          className="border-border bg-background text-foreground focus:ring-ring flex-1 rounded-md border px-3 py-2 text-sm outline-none focus:ring-2"
          value={pergunta}
          onChange={(e) => setPergunta(e.target.value)}
          placeholder="Pergunte sobre lucro, CMV, compras, campanhas..."
          maxLength={500}
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Analisando..." : "Perguntar"}
        </Button>
      </form>

      {erro && (
        <Text size="sm" tone="danger">
          {erro}
        </Text>
      )}

      {resultado && (
        <div className="border-border bg-card flex flex-col gap-3 rounded-lg border p-4">
          <div>
            <Text size="sm" tone="muted">
              Intenção: {resultado.intencao}
            </Text>
            <pre className="text-foreground mt-2 whitespace-pre-wrap text-sm">
              {resultado.resposta}
            </pre>
          </div>
          <div className="border-border border-t pt-3">
            <Text weight="semibold" size="sm">
              Como cheguei a essa conclusão
            </Text>
            <Text size="sm" tone="muted" className="mt-1">
              {resultado.explicacao}
            </Text>
          </div>
          {resultado.fontes.length > 0 && (
            <div>
              <Text weight="semibold" size="sm">
                Fontes (dados do restaurante)
              </Text>
              <ul className="text-muted-foreground mt-1 list-inside list-disc text-sm">
                {resultado.fontes.map((f) => (
                  <li key={`${f.modulo}-${f.descricao}`}>
                    {f.modulo}: {f.descricao}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
