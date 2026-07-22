"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

import { perguntarIaCompras } from "../actions";

const SUGESTOES = [
  "O que preciso comprar amanhã?",
  "Qual fornecedor está mais barato?",
  "Quanto vou consumir na próxima semana?",
  "Qual produto está parado?",
  "Qual produto gira mais?",
  "Quanto dinheiro está parado em estoque?",
  "Qual produto mais gera desperdício?",
];

export function IaComprasPanel() {
  const [pergunta, setPergunta] = useState(SUGESTOES[0]!);
  const [resposta, setResposta] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function perguntar(texto: string) {
    setPergunta(texto);
    setErro(null);
    startTransition(async () => {
      try {
        const r = await perguntarIaCompras({ pergunta: texto });
        setResposta(r.resposta);
      } catch (error) {
        setErro(error instanceof Error ? error.message : "Falha na IA de compras.");
      }
    });
  }

  return (
    <div className="border-border bg-card flex flex-col gap-3 rounded-lg border p-4">
      <div>
        <Text weight="semibold">IA de Compras</Text>
        <Text size="sm" tone="muted">
          Pergunte sobre compras, giro, perdas e capital parado.
        </Text>
      </div>

      <div className="flex flex-wrap gap-2">
        {SUGESTOES.map((s) => (
          <Button key={s} size="sm" variant="outline" disabled={pending} onClick={() => perguntar(s)}>
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
          placeholder="Digite sua pergunta..."
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
      {resposta && (
        <pre className="bg-background border-border text-foreground whitespace-pre-wrap rounded-md border p-3 text-sm">
          {resposta}
        </pre>
      )}
    </div>
  );
}
