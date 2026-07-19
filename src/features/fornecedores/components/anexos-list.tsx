"use client";

import { useRef, useTransition } from "react";
import { Paperclip, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import type { Tables } from "@/lib/supabase/database.types";

import { adicionarAnexo, removerAnexo } from "../actions";

export interface AnexosListProps {
  referenciaTipo: "fornecedor" | "solicitacao_compra" | "pedido_compra" | "recebimento";
  referenciaId: string;
  anexos: Tables<"compras_anexos">[];
}

/**
 * Este projeto não integra armazenamento de arquivos (nenhuma sprint usa
 * Supabase Storage) — "anexo" aqui é sempre um link colado pelo usuário
 * (Drive/Dropbox/etc.), não upload real. Documentado também na migration
 * 0054.
 */
export function AnexosList({ referenciaTipo, referenciaId, anexos }: AnexosListProps) {
  const [pending, startTransition] = useTransition();
  const nomeRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);

  function adicionar() {
    const nomeArquivo = nomeRef.current?.value.trim();
    const url = urlRef.current?.value.trim();
    if (!nomeArquivo || !url) return;

    startTransition(async () => {
      try {
        await adicionarAnexo({ referenciaTipo, referenciaId, nomeArquivo, url });
        if (nomeRef.current) nomeRef.current.value = "";
        if (urlRef.current) urlRef.current.value = "";
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "Não foi possível anexar.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Input ref={nomeRef} placeholder="Nome do documento" className="max-w-56" />
        <Input ref={urlRef} placeholder="Link (Drive, Dropbox...)" className="max-w-80" />
        <Button type="button" variant="outline" size="sm" disabled={pending} onClick={adicionar}>
          <Paperclip className="h-4 w-4" />
          Anexar
        </Button>
      </div>

      {anexos.length === 0 ? (
        <Text size="sm" tone="muted">
          Nenhum anexo.
        </Text>
      ) : (
        <ul className="flex flex-col gap-1">
          {anexos.map((anexo) => (
            <li key={anexo.id} className="flex items-center justify-between gap-2 text-sm">
              <a
                href={anexo.url}
                target="_blank"
                rel="noreferrer"
                className="text-primary flex items-center gap-1.5 hover:underline"
              >
                <Paperclip className="h-3.5 w-3.5" />
                {anexo.nome_arquivo}
              </a>
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => startTransition(() => removerAnexo(anexo.id))}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Remover</span>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
