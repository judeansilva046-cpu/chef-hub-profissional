"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/number-field";
import { Select } from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { Textarea } from "@/components/ui/textarea";
import { formatarDataHora, formatarMoeda } from "@/lib/format";

import { abrirCaixa, fecharCaixa, registrarMovimentacaoCaixa } from "../actions";
import type { CaixaDetalhado } from "../queries";
import { TIPOS_MOVIMENTACAO_MANUAL } from "../validation";

const TIPO_MOVIMENTACAO_LABEL: Record<string, string> = {
  entrada: "Entrada",
  sangria: "Sangria",
  suprimento: "Suprimento",
  venda: "Venda",
};

export interface CaixaWorkspaceProps {
  detalhe: CaixaDetalhado | null;
}

export function CaixaWorkspace({ detalhe }: CaixaWorkspaceProps) {
  if (!detalhe) return <AbrirCaixaForm />;
  return <CaixaAberto detalhe={detalhe} />;
}

function AbrirCaixaForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [saldoInicial, setSaldoInicial] = useState<number | null>(0);
  const [observacoes, setObservacoes] = useState("");

  function abrir() {
    setErro(null);
    startTransition(async () => {
      try {
        await abrirCaixa({ saldoInicial: saldoInicial ?? 0, observacoes });
        router.refresh();
      } catch (error) {
        setErro(error instanceof Error ? error.message : "Não foi possível abrir o caixa.");
      }
    });
  }

  return (
    <div className="border-border flex max-w-sm flex-col gap-4 rounded-lg border p-4">
      <Text weight="medium">Abrir caixa</Text>
      <div className="flex flex-col gap-1.5">
        <Text size="sm" tone="muted">
          Saldo inicial
        </Text>
        <CurrencyInput value={saldoInicial} onChange={setSaldoInicial} min={0} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Text size="sm" tone="muted">
          Observações (opcional)
        </Text>
        <Textarea rows={2} value={observacoes} onChange={(event) => setObservacoes(event.target.value)} />
      </div>
      {erro && (
        <Text size="sm" tone="danger">
          {erro}
        </Text>
      )}
      <Button disabled={pending} onClick={abrir}>
        {pending ? "Abrindo..." : "Abrir caixa"}
      </Button>
    </div>
  );
}

function CaixaAberto({ detalhe }: { detalhe: CaixaDetalhado }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const [tipoMovimentacao, setTipoMovimentacao] = useState<(typeof TIPOS_MOVIMENTACAO_MANUAL)[number]>("suprimento");
  const [valorMovimentacao, setValorMovimentacao] = useState<number | null>(null);
  const [observacaoMovimentacao, setObservacaoMovimentacao] = useState("");

  const [fechando, setFechando] = useState(false);
  const [saldoInformado, setSaldoInformado] = useState<number | null>(null);
  const [observacoesFechamento, setObservacoesFechamento] = useState("");

  const totalEntradas = detalhe.movimentacoes
    .filter((m) => m.tipo === "entrada" || m.tipo === "suprimento")
    .reduce((soma, m) => soma + m.valor, 0);
  const totalSangrias = detalhe.movimentacoes.filter((m) => m.tipo === "sangria").reduce((soma, m) => soma + m.valor, 0);
  const totalVendasDinheiro = detalhe.movimentacoes
    .filter((m) => m.tipo === "venda" && m.forma_pagamento === "dinheiro")
    .reduce((soma, m) => soma + m.valor, 0);
  const totalVendas = detalhe.movimentacoes.filter((m) => m.tipo === "venda").reduce((soma, m) => soma + m.valor, 0);
  const saldoEsperadoAtual = detalhe.caixa.saldo_inicial + totalEntradas + totalVendasDinheiro - totalSangrias;

  function rodar(acao: () => Promise<void>) {
    setErro(null);
    startTransition(async () => {
      try {
        await acao();
        router.refresh();
      } catch (error) {
        setErro(error instanceof Error ? error.message : "Não foi possível concluir a ação.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="success">Caixa aberto</Badge>
        <Text tone="muted">Aberto em {formatarDataHora(detalhe.caixa.aberto_em)}</Text>
        {detalhe.caixa.profiles && <Text tone="muted">Operador: {detalhe.caixa.profiles.nome_completo}</Text>}
      </div>

      {erro && (
        <Text size="sm" tone="danger">
          {erro}
        </Text>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Resumo label="Saldo inicial" valor={detalhe.caixa.saldo_inicial} />
        <Resumo label="Vendas" valor={totalVendas} />
        <Resumo label="Sangrias" valor={totalSangrias} />
        <Resumo label="Saldo esperado (dinheiro)" valor={saldoEsperadoAtual} />
      </div>

      <div className="flex flex-col gap-2">
        <Text weight="medium">Movimentações</Text>
        <div className="flex flex-col gap-1">
          {detalhe.movimentacoes.length === 0 ? (
            <Text tone="muted" size="sm">
              Nenhuma movimentação registrada.
            </Text>
          ) : (
            detalhe.movimentacoes.map((mov) => (
              <div key={mov.id} className="flex justify-between text-sm">
                <Text tone="muted">
                  {TIPO_MOVIMENTACAO_LABEL[mov.tipo] ?? mov.tipo}
                  {mov.observacao ? ` — ${mov.observacao}` : ""}
                </Text>
                <Text>{formatarMoeda(mov.valor)}</Text>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Select
          className="w-40"
          value={tipoMovimentacao}
          onChange={(event) => setTipoMovimentacao(event.target.value as (typeof TIPOS_MOVIMENTACAO_MANUAL)[number])}
        >
          {TIPOS_MOVIMENTACAO_MANUAL.map((tipo) => (
            <option key={tipo} value={tipo}>
              {TIPO_MOVIMENTACAO_LABEL[tipo]}
            </option>
          ))}
        </Select>
        <CurrencyInput className="w-32" value={valorMovimentacao} onChange={setValorMovimentacao} min={0} />
        <input
          type="text"
          placeholder="Observação (opcional)"
          value={observacaoMovimentacao}
          onChange={(event) => setObservacaoMovimentacao(event.target.value)}
          className="border-input bg-background text-foreground h-10 flex-1 rounded-md border px-3 text-sm"
        />
        <Button
          type="button"
          variant="outline"
          disabled={pending || !valorMovimentacao}
          onClick={() =>
            rodar(async () => {
              await registrarMovimentacaoCaixa(detalhe.caixa.id, {
                tipo: tipoMovimentacao,
                valor: valorMovimentacao,
                observacao: observacaoMovimentacao,
              });
              setValorMovimentacao(null);
              setObservacaoMovimentacao("");
            })
          }
        >
          Registrar
        </Button>
      </div>

      {!fechando ? (
        <Button type="button" variant="ghost" className="w-fit" onClick={() => setFechando(true)}>
          Fechar caixa
        </Button>
      ) : (
        <div className="border-border flex max-w-sm flex-col gap-3 rounded-lg border p-4">
          <Text weight="medium">Fechar caixa</Text>
          <Text size="sm" tone="muted">
            Saldo esperado: {formatarMoeda(saldoEsperadoAtual)}
          </Text>
          <div className="flex flex-col gap-1.5">
            <Text size="sm" tone="muted">
              Saldo contado
            </Text>
            <CurrencyInput value={saldoInformado} onChange={setSaldoInformado} min={0} />
          </div>
          <Textarea
            rows={2}
            placeholder="Observações (opcional)"
            value={observacoesFechamento}
            onChange={(event) => setObservacoesFechamento(event.target.value)}
          />
          <div className="flex gap-2">
            <Button
              disabled={pending || saldoInformado === null}
              onClick={() =>
                rodar(() =>
                  fecharCaixa(detalhe.caixa.id, {
                    saldoInformado: saldoInformado ?? 0,
                    observacoes: observacoesFechamento,
                  }),
                )
              }
            >
              Confirmar fechamento
            </Button>
            <Button variant="ghost" onClick={() => setFechando(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Resumo({ label, valor }: { label: string; valor: number }) {
  return (
    <div className="border-border rounded-lg border p-3">
      <Text size="sm" tone="muted">
        {label}
      </Text>
      <Text weight="semibold">{formatarMoeda(valor)}</Text>
    </div>
  );
}
