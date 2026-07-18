"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { avancarStatusPedido, iniciarPreparoPedido } from "@/features/pedidos/actions";
import { TIPO_PEDIDO_LABEL } from "@/features/pedidos/status";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";
import type { Tables } from "@/lib/supabase/database.types";

import type { PedidoParaKds } from "../queries";

const LIMITE_ATRASO_MINUTOS = 15;

export interface KdsBoardProps {
  pedidos: PedidoParaKds[];
  pracas: Tables<"pracas_producao">[];
  empresaId: string;
}

export function KdsBoard({ pedidos, pracas, empresaId }: KdsBoardProps) {
  useRealtimeRefresh(["pedidos"], empresaId);

  const [pracaId, setPracaId] = useState("");

  const pedidosFiltrados = pedidos
    .map((pedido) => ({
      ...pedido,
      pedido_itens: pracaId
        ? pedido.pedido_itens.filter((item) => item.fichas_tecnicas.praca_producao_id === pracaId)
        : pedido.pedido_itens,
    }))
    .filter((pedido) => pedido.pedido_itens.length > 0);

  const novos = pedidosFiltrados.filter((p) => p.status === "confirmado");
  const emPreparo = pedidosFiltrados.filter((p) => p.status === "em_preparo");
  const prontos = pedidosFiltrados.filter((p) => p.status === "pronto");

  return (
    <div data-theme="dark" className="bg-background flex h-full flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <Text weight="semibold" size="lg" className="text-foreground">
          KDS
        </Text>
        <Select className="w-48" value={pracaId} onChange={(event) => setPracaId(event.target.value)}>
          <option value="">Todas as praças</option>
          {pracas.map((praca) => (
            <option key={praca.id} value={praca.id}>
              {praca.nome}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden md:grid-cols-3">
        <KdsColuna titulo="Novos" pedidos={novos} acao="iniciar" />
        <KdsColuna titulo="Em preparo" pedidos={emPreparo} acao="pronto" />
        <KdsColuna titulo="Prontos" pedidos={prontos} acao={null} />
      </div>
    </div>
  );
}

function KdsColuna({
  titulo,
  pedidos,
  acao,
}: {
  titulo: string;
  pedidos: PedidoParaKds[];
  acao: "iniciar" | "pronto" | null;
}) {
  return (
    <div className="border-border bg-card flex flex-col gap-3 overflow-auto rounded-lg border p-3">
      <Text weight="medium" className="text-foreground">
        {titulo} ({pedidos.length})
      </Text>
      {pedidos.map((pedido) => (
        <KdsCard key={pedido.id} pedido={pedido} acao={acao} />
      ))}
    </div>
  );
}

function KdsCard({ pedido, acao }: { pedido: PedidoParaKds; acao: "iniciar" | "pronto" | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    const intervalo = setInterval(() => setAgora(Date.now()), 15000);
    return () => clearInterval(intervalo);
  }, []);

  const referencia = pedido.confirmado_em ?? pedido.criado_em;
  const minutosDecorridos = Math.floor((agora - new Date(referencia).getTime()) / 60000);
  const atrasado = minutosDecorridos >= LIMITE_ATRASO_MINUTOS;

  function executarAcao() {
    setErro(null);
    startTransition(async () => {
      try {
        if (acao === "iniciar") await iniciarPreparoPedido(pedido.id);
        if (acao === "pronto") await avancarStatusPedido(pedido.id, "em_preparo");
        router.refresh();
      } catch (error) {
        setErro(error instanceof Error ? error.message : "Não foi possível concluir a ação.");
      }
    });
  }

  return (
    <div
      className={`bg-background flex flex-col gap-2 rounded-md border p-3 ${
        atrasado ? "border-danger animate-pulse" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between">
        <Text weight="semibold" className="text-foreground">
          #{pedido.numero}
        </Text>
        <Badge variant={atrasado ? "danger" : "outline"}>{minutosDecorridos} min</Badge>
      </div>
      <Text size="sm" tone="muted">
        {TIPO_PEDIDO_LABEL[pedido.tipo] ?? pedido.tipo}
      </Text>
      <div className="flex flex-col gap-1">
        {pedido.pedido_itens.map((item) => (
          <div key={item.id} className="text-foreground text-sm">
            {item.quantidade}x {item.fichas_tecnicas.nome}
            {item.observacao && <span className="text-muted-foreground"> — {item.observacao}</span>}
          </div>
        ))}
      </div>
      {pedido.observacoes && (
        <Text size="sm" tone="warning">
          {pedido.observacoes}
        </Text>
      )}
      {erro && (
        <Text size="sm" tone="danger">
          {erro}
        </Text>
      )}
      {acao && (
        <Button size="sm" disabled={pending} onClick={executarAcao}>
          {acao === "iniciar" ? "Iniciar preparo" : "Marcar pronto"}
        </Button>
      )}
    </div>
  );
}
