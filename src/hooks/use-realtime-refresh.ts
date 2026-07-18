"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

/**
 * Assina postgres_changes (Supabase Realtime, greenfield na Sprint 05 — ver
 * migration 0037) nas tabelas informadas, filtradas pela empresa ativa, e
 * chama router.refresh() a cada mudança. Deixa o Server Component buscar os
 * dados de novo (fonte única de verdade) em vez de tentar mesclar o payload
 * do Realtime no estado local — evita duplicar a lógica de junção que as
 * queries já fazem (itens + relações). RLS do Supabase já filtra por
 * empresa no nível de linha; o filtro aqui é só para não acordar o cliente
 * à toa em mudanças de outras empresas que porventura cheguem no mesmo
 * canal.
 */
export function useRealtimeRefresh(tabelas: string[], empresaId: string) {
  const router = useRouter();
  const chave = tabelas.join(",");

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`realtime-${chave}-${empresaId}`);

    for (const tabela of chave.split(",")) {
      channel.on(
        "postgres_changes" as never,
        { event: "*", schema: "public", table: tabela, filter: `empresa_id=eq.${empresaId}` } as never,
        () => router.refresh(),
      );
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave, empresaId]);
}
