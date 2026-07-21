"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { iniciarPreparoPedido, marcarItensProntos } from "@/features/pedidos/actions";
import { TIPO_PEDIDO_LABEL } from "@/features/pedidos/status";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";

import {
  expedirPedidoKds,
  marcarItemProntoKds,
  reimprimirPedidoKds,
} from "../actions";
import { formatarDuracao, tempoItemSegundos, tempoPedidoSegundos } from "../metrics";
import { priorizarFilaKds } from "../prioridade";
import type { KdsConfig, KdsEvento, PedidoParaKds, PracaProducaoKds } from "../queries";
import { EVENTO_KDS_LABEL, SETOR_KDS_LABEL, STATUS_KDS_LABEL } from "../status";
import { useKdsSoundAlerts } from "../use-kds-sound";

export interface KdsBoardProps {
  pedidos: PedidoParaKds[];
  pracas: PracaProducaoKds[];
  empresaId: string;
  config: KdsConfig;
  eventos: KdsEvento[];
  metricas: {
    tempoMedioItemSegundos: number | null;
    tempoMedioPedidoSegundos: number | null;
  };
}

type AcaoCard = "iniciar" | "pronto" | "expedir" | null;

export function KdsBoard({
  pedidos,
  pracas,
  empresaId,
  config,
  eventos,
  metricas,
}: KdsBoardProps) {
  useRealtimeRefresh(["pedidos", "pedido_itens", "kds_events", "fila_impressao"], empresaId);

  const [setor, setSetor] = useState("");
  const [pracaId, setPracaId] = useState("");
  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    const intervalo = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(intervalo);
  }, []);

  const pracasDoSetor = useMemo(
    () => (setor ? pracas.filter((p) => p.setor === setor) : pracas),
    [pracas, setor],
  );

  const pedidosFiltrados = useMemo(() => {
    return pedidos
      .map((pedido) => ({
        ...pedido,
        pedido_itens: pedido.pedido_itens.filter((item) => {
          const itemSetor = item.fichas_tecnicas.praca_setor ?? "cozinha";
          if (setor && itemSetor !== setor) return false;
          if (!pracaId) return true;
          return (
            item.fichas_tecnicas.praca_producao_id === pracaId ||
            item.fichas_tecnicas.praca_producao_id === null
          );
        }),
      }))
      .filter((pedido) => pedido.pedido_itens.length > 0);
  }, [pedidos, setor, pracaId]);

  const basePrioridade = useMemo(
    () =>
      pedidosFiltrados.map((p) => ({
        ...p,
        referenciaEm: p.confirmado_em ?? p.criado_em,
        itensPendentes: p.pedido_itens.filter((i) => i.status_preparo !== "pronto").length,
      })),
    [pedidosFiltrados],
  );

  const priorizados = useMemo(
    () =>
      priorizarFilaKds(basePrioridade, agora, {
        alertaAtrasoMinutos: config.alerta_atraso_minutos,
        prioridadeEntregaBoost: config.prioridade_entrega_boost,
      }),
    [basePrioridade, agora, config.alerta_atraso_minutos, config.prioridade_entrega_boost],
  );

  const novos = priorizados.filter((p) => p.status === "confirmado");
  const emPreparo = priorizados.filter(
    (p) =>
      p.status === "em_preparo" &&
      p.pedido_itens.some((item) => item.status_preparo !== "pronto"),
  );
  const prontos = priorizados.filter(
    (p) =>
      p.status === "pronto" ||
      (p.status === "em_preparo" &&
        p.pedido_itens.every((item) => item.status_preparo === "pronto")),
  );
  const expedidos = priorizados.filter((p) => p.status === "saiu_para_entrega");

  const idsNovos = useMemo(() => novos.map((p) => p.id), [novos]);
  const idsAtrasados = useMemo(
    () => priorizados.filter((p) => p.atrasado && p.status !== "saiu_para_entrega").map((p) => p.id),
    [priorizados],
  );

  useKdsSoundAlerts({
    habilitado: config.alerta_sonoro,
    idsNovos,
    idsAtrasados,
  });

  return (
    <div data-theme="dark" className="bg-background flex h-full flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Text weight="semibold" size="lg" className="text-foreground">
            KDS
          </Text>
          <Badge variant="outline">Fila {priorizados.length}</Badge>
          <Badge variant="outline">
            Médio item {formatarDuracao(metricas.tempoMedioItemSegundos)}
          </Badge>
          <Badge variant="outline">
            Médio pedido {formatarDuracao(metricas.tempoMedioPedidoSegundos)}
          </Badge>
          {config.impressao_automatica && (
            <Badge variant="info">Impressão automática</Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            className="w-40"
            value={setor}
            onChange={(event) => {
              setSetor(event.target.value);
              setPracaId("");
            }}
          >
            <option value="">Todos os setores</option>
            {Object.entries(SETOR_KDS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Select
            className="w-48"
            value={pracaId}
            onChange={(event) => setPracaId(event.target.value)}
          >
            <option value="">Todas as praças</option>
            {pracasDoSetor.map((praca) => (
              <option key={praca.id} value={praca.id}>
                {praca.nome}
              </option>
            ))}
          </Select>
          <Button
            size="sm"
            variant={mostrarHistorico ? "secondary" : "outline"}
            onClick={() => setMostrarHistorico((v) => !v)}
          >
            Histórico
          </Button>
          <Link
            href="/expedicao"
            className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
          >
            Expedição
          </Link>
        </div>
      </div>

      <div
        className={`grid flex-1 gap-3 overflow-hidden ${
          mostrarHistorico
            ? "grid-cols-1 xl:grid-cols-[1fr_280px]"
            : "grid-cols-1"
        }`}
      >
        <div className="grid grid-cols-1 gap-3 overflow-hidden md:grid-cols-2 xl:grid-cols-4">
          <KdsColuna
            titulo="Novos / Confirmado"
            pedidos={novos}
            acao="iniciar"
            pracaId={pracaId || null}
            agora={agora}
            alertaMinutos={config.alerta_atraso_minutos}
          />
          <KdsColuna
            titulo="Em preparo"
            pedidos={emPreparo}
            acao="pronto"
            pracaId={pracaId || null}
            agora={agora}
            alertaMinutos={config.alerta_atraso_minutos}
            itemAItem
          />
          <KdsColuna
            titulo="Prontos"
            pedidos={prontos}
            acao="expedir"
            pracaId={pracaId || null}
            agora={agora}
            alertaMinutos={config.alerta_atraso_minutos}
          />
          <KdsColuna
            titulo="Expedidos"
            pedidos={expedidos}
            acao={null}
            pracaId={pracaId || null}
            agora={agora}
            alertaMinutos={config.alerta_atraso_minutos}
          />
        </div>

        {mostrarHistorico && (
          <aside className="border-border bg-card flex flex-col gap-2 overflow-auto rounded-lg border p-3">
            <Text weight="medium" className="text-foreground">
              Histórico ({eventos.length})
            </Text>
            {eventos.length === 0 ? (
              <Text size="sm" tone="muted">
                Sem eventos recentes.
              </Text>
            ) : (
              eventos.map((evento) => (
                <div key={evento.id} className="border-border border-b pb-2 last:border-0">
                  <div className="flex items-center justify-between gap-2">
                    <Text size="sm" weight="medium" className="text-foreground">
                      {EVENTO_KDS_LABEL[evento.evento] ?? evento.evento}
                    </Text>
                    <Text size="sm" tone="muted">
                      {new Date(evento.criado_em).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </Text>
                  </div>
                  <Text size="sm" tone="muted">
                    Pedido · {String((evento.metadados as { numero?: number })?.numero ?? "—")}
                    {evento.setor ? ` · ${SETOR_KDS_LABEL[evento.setor] ?? evento.setor}` : ""}
                  </Text>
                </div>
              ))
            )}
          </aside>
        )}
      </div>
    </div>
  );
}

function KdsColuna({
  titulo,
  pedidos,
  acao,
  pracaId,
  agora,
  alertaMinutos,
  itemAItem = false,
}: {
  titulo: string;
  pedidos: Array<
    PedidoParaKds & { minutosEspera: number; scorePrioridade: number; atrasado: boolean }
  >;
  acao: AcaoCard;
  pracaId: string | null;
  agora: number;
  alertaMinutos: number;
  itemAItem?: boolean;
}) {
  return (
    <div className="border-border bg-card flex flex-col gap-3 overflow-auto rounded-lg border p-3">
      <Text weight="medium" className="text-foreground">
        {titulo} ({pedidos.length})
      </Text>
      {pedidos.length === 0 ? (
        <Text size="sm" tone="muted">
          Vazio
        </Text>
      ) : (
        pedidos.map((pedido) => (
          <KdsCard
            key={pedido.id}
            pedido={pedido}
            acao={acao}
            pracaId={pracaId}
            agora={agora}
            alertaMinutos={alertaMinutos}
            itemAItem={itemAItem}
          />
        ))
      )}
    </div>
  );
}

function KdsCard({
  pedido,
  acao,
  pracaId,
  agora,
  alertaMinutos,
  itemAItem,
}: {
  pedido: PedidoParaKds & { minutosEspera: number; scorePrioridade: number; atrasado: boolean };
  acao: AcaoCard;
  pracaId: string | null;
  agora: number;
  alertaMinutos: number;
  itemAItem: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const segundosPedido = tempoPedidoSegundos(pedido, agora);
  const atrasado = pedido.minutosEspera >= alertaMinutos;

  function rodar(fn: () => Promise<void>) {
    setErro(null);
    startTransition(async () => {
      try {
        await fn();
        router.refresh();
      } catch (error) {
        setErro(error instanceof Error ? error.message : "Não foi possível concluir a ação.");
      }
    });
  }

  const precisaExpedicaoExterna =
    acao === "expedir" && (pedido.tipo === "entrega" || pedido.tipo === "retirada");

  return (
    <div
      className={`bg-background flex flex-col gap-2 rounded-md border p-3 ${
        atrasado ? "border-danger animate-pulse" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <Text weight="semibold" className="text-foreground">
          #{pedido.numero}
        </Text>
        <div className="flex items-center gap-1">
          <Badge variant={atrasado ? "danger" : "outline"}>
            {formatarDuracao(segundosPedido)}
          </Badge>
          {pedido.scorePrioridade >= 100 && <Badge variant="warning">Prioritário</Badge>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <Badge variant="outline">{TIPO_PEDIDO_LABEL[pedido.tipo] ?? pedido.tipo}</Badge>
        <Badge variant="outline">{STATUS_KDS_LABEL[pedido.status] ?? pedido.status}</Badge>
      </div>

      <div className="flex flex-col gap-1">
        {pedido.pedido_itens.map((item) => {
          const tempoItem = tempoItemSegundos(item, agora);
          return (
            <div
              key={item.id}
              className="text-foreground flex items-start justify-between gap-2 text-sm"
            >
              <span>
                {item.quantidade}x {item.fichas_tecnicas.nome}
                {item.observacao && (
                  <span className="text-muted-foreground"> — {item.observacao}</span>
                )}
                {item.fichas_tecnicas.praca_setor && (
                  <span className="text-muted-foreground">
                    {" "}
                    · {SETOR_KDS_LABEL[item.fichas_tecnicas.praca_setor] ?? item.fichas_tecnicas.praca_setor}
                  </span>
                )}
              </span>
              <div className="flex shrink-0 items-center gap-1">
                {tempoItem != null && (
                  <span className="text-muted-foreground tabular-nums text-xs">
                    {formatarDuracao(tempoItem)}
                  </span>
                )}
                {itemAItem && item.status_preparo !== "pronto" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => rodar(() => marcarItemProntoKds(item.id))}
                  >
                    Pronto
                  </Button>
                ) : (
                  <Badge variant={item.status_preparo === "pronto" ? "success" : "outline"}>
                    {item.status_preparo === "pronto"
                      ? "Pronto"
                      : item.status_preparo === "em_preparo"
                        ? "Preparo"
                        : "Pendente"}
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
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

      <div className="flex flex-wrap gap-2">
        {acao === "iniciar" && (
          <Button size="sm" disabled={pending} onClick={() => rodar(() => iniciarPreparoPedido(pedido.id))}>
            Iniciar preparo
          </Button>
        )}
        {acao === "pronto" && (
          <Button
            size="sm"
            disabled={pending}
            onClick={() => rodar(() => marcarItensProntos(pedido.id, pracaId))}
          >
            {pracaId ? "Marcar praça pronta" : "Marcar pronto"}
          </Button>
        )}
        {acao === "expedir" && !precisaExpedicaoExterna && (
          <Button size="sm" disabled={pending} onClick={() => rodar(() => expedirPedidoKds(pedido.id))}>
            Expedir
          </Button>
        )}
        {acao === "expedir" && precisaExpedicaoExterna && (
          <Link
            href="/expedicao"
            className={cn(buttonVariants({ size: "sm", variant: "secondary" }))}
          >
            Ir à expedição
          </Link>
        )}
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() => rodar(() => reimprimirPedidoKds(pedido.id))}
        >
          Reimprimir
        </Button>
      </div>
    </div>
  );
}
