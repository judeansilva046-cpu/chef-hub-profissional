"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { formatarMoeda } from "@/lib/format";

import { gerarSugestoesCompra } from "../actions";
import type { DashboardEstoqueInteligente } from "../queries";
import { IaComprasPanel } from "./ia-compras-panel";

export function DashboardInteligente({ data }: { data: DashboardEstoqueInteligente }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function gerar() {
    setMsg(null);
    startTransition(async () => {
      try {
        const n = await gerarSugestoesCompra({ horizonteDias: 7, diasHistorico: 30 });
        setMsg(`${n} sugestões geradas.`);
        router.refresh();
      } catch (error) {
        setMsg(error instanceof Error ? error.message : "Falha ao gerar sugestões.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Heading level={2}>Estoque inteligente</Heading>
          <Text tone="muted">
            Curva ABC, giro, cobertura, previsão de compras, CMV e IA operacional.
          </Text>
        </div>
        <Button disabled={pending} onClick={gerar}>
          {pending ? "Gerando..." : "Gerar sugestões de compra"}
        </Button>
      </div>

      {msg && (
        <Text size="sm" tone="muted">
          {msg}
        </Text>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Itens analisados" value={String(data.resumo.itensAnalisados)} />
        <Kpi label="Classe A (consumo)" value={String(data.resumo.classeA)} />
        <Kpi
          label="Cobertura média"
          value={
            data.resumo.coberturaMedia != null ? `${data.resumo.coberturaMedia} dias` : "—"
          }
        />
        <Kpi label="CMV período" value={formatarMoeda(data.cmv.cmv)} />
        <Kpi label="Valor parado" value={formatarMoeda(data.valorParado)} />
        <Kpi label="Perdas (custo)" value={formatarMoeda(data.cmv.perdasValor)} />
        <Kpi label="Economia estimada" value={formatarMoeda(data.economiaEstimada)} />
        <Kpi label="Alertas" value={String(data.alertas.length)} />
      </div>

      <IaComprasPanel />

      <section className="grid gap-4 xl:grid-cols-2">
        <Painel titulo="Alertas de estoque mínimo">
          {data.alertas.length === 0 ? (
            <Text size="sm" tone="muted">
              Nenhum alerta no momento.
            </Text>
          ) : (
            <ul className="flex flex-col gap-2">
              {data.alertas.slice(0, 12).map((a) => (
                <li key={a.ingredienteId} className="flex items-center justify-between gap-2 text-sm">
                  <span>{a.nome}</span>
                  <Badge
                    variant={
                      a.nivel === "zerado" || a.nivel === "critico" ? "danger" : "warning"
                    }
                  >
                    {a.nivel} · {a.estoqueAtual}/{a.estoqueMinimo}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Painel>

        <Painel titulo="CMV inteligente">
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <DtDd label="Estoque inicial" value={formatarMoeda(data.cmv.estoqueInicialValor)} />
            <DtDd label="Compras" value={formatarMoeda(data.cmv.comprasValor)} />
            <DtDd label="Estoque final" value={formatarMoeda(data.cmv.estoqueFinalValor)} />
            <DtDd label="Perdas" value={formatarMoeda(data.cmv.perdasValor)} />
            <DtDd label="CMV" value={formatarMoeda(data.cmv.cmv)} />
            <DtDd
              label="CMV % vendas"
              value={
                data.cmv.cmvPercentualSobreVendas != null
                  ? `${data.cmv.cmvPercentualSobreVendas}%`
                  : "—"
              }
            />
          </dl>
        </Painel>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Painel titulo="Curva ABC (consumo)">
          <AbcLista items={data.abc.consumo.slice(0, 10)} />
        </Painel>
        <Painel titulo="Curva ABC (faturamento/custo)">
          <AbcLista items={data.abc.faturamento.slice(0, 10)} />
        </Painel>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Painel titulo="Maior giro">
          <ul className="flex flex-col gap-2 text-sm">
            {data.giros.slice(0, 10).map((g) => (
              <li key={g.ingredienteId} className="flex justify-between gap-2">
                <span>{g.nome}</span>
                <span className="text-muted-foreground">
                  {g.giroMensal}×/mês · cob. {g.diasCobertura ?? "—"}d
                </span>
              </li>
            ))}
          </ul>
        </Painel>
        <Painel titulo="Sugestões de compra">
          {data.previsoes.length === 0 ? (
            <Text size="sm" tone="muted">
              Nenhuma compra sugerida para o horizonte.
            </Text>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {data.previsoes.slice(0, 12).map((p) => (
                <li key={p.ingredienteId} className="flex flex-col gap-1 border-b border-border pb-2 last:border-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{p.nome}</span>
                    <Badge
                      variant={
                        p.prioridade === "critica" || p.prioridade === "alta"
                          ? "danger"
                          : "outline"
                      }
                    >
                      {p.prioridade}
                    </Badge>
                  </div>
                  <Text size="sm" tone="muted">
                    Comprar {p.quantidadeSugerida} até {p.comprarAte}
                    {p.fornecedorNome ? ` · ${p.fornecedorNome}` : ""}
                  </Text>
                </li>
              ))}
            </ul>
          )}
        </Painel>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Painel titulo="Consumo por categoria">
          <ul className="flex flex-col gap-2 text-sm">
            {data.consumoPorCategoria.slice(0, 8).map((c) => (
              <li key={c.chave} className="flex justify-between">
                <span>{c.label}</span>
                <span className="text-muted-foreground">mensal {c.mensal}</span>
              </li>
            ))}
          </ul>
        </Painel>
        <Painel titulo="Perdas / desperdício">
          {data.perdasPorProduto.length === 0 ? (
            <Text size="sm" tone="muted">
              Sem perdas registradas no período.
            </Text>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {data.perdasPorProduto.slice(0, 8).map((p) => (
                <li key={p.nome} className="flex justify-between">
                  <span>{p.nome}</span>
                  <span className="text-muted-foreground">
                    {p.quantidade} · {formatarMoeda(p.custo)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Painel>
      </section>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border bg-card rounded-lg border p-4">
      <Text size="sm" tone="muted">
        {label}
      </Text>
      <Text weight="semibold" size="lg">
        {value}
      </Text>
    </div>
  );
}

function Painel({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="border-border bg-card flex flex-col gap-3 rounded-lg border p-4">
      <Text weight="semibold">{titulo}</Text>
      {children}
    </div>
  );
}

function AbcLista({
  items,
}: {
  items: DashboardEstoqueInteligente["abc"]["consumo"];
}) {
  if (items.length === 0) {
    return (
      <Text size="sm" tone="muted">
        Sem dados no período.
      </Text>
    );
  }
  return (
    <ul className="flex flex-col gap-2 text-sm">
      {items.map((i) => (
        <li key={i.ingredienteId} className="flex items-center justify-between gap-2">
          <span>
            <Badge variant={i.classe === "A" ? "danger" : i.classe === "B" ? "warning" : "outline"}>
              {i.classe}
            </Badge>{" "}
            {i.nome}
          </span>
          <span className="text-muted-foreground">{i.percentual}%</span>
        </li>
      ))}
    </ul>
  );
}

function DtDd({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
