"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CurrencyInput, NumberField, PercentInput } from "@/components/ui/number-field";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Text } from "@/components/ui/text";
import { FilaImpressaoLista } from "@/features/impressao/components/fila-impressao-lista";
import type { Tables } from "@/lib/supabase/database.types";
import { formatarDataHora, formatarMoeda } from "@/lib/format";

import {
  adicionarAdicionalItem,
  adicionarItemPedido,
  atualizarQuantidadeItem,
  atualizarValoresPedido,
  avancarStatusPedido,
  cancelarPedido,
  confirmarPedido,
  concluirPedido,
  duplicarPedido,
  iniciarPreparoPedido,
  registrarPagamentoPedido,
  removerAdicionalItem,
  removerItemPedido,
} from "../actions";
import { calcularTotalPedido } from "../calculations";
import type { PedidoDetalhado } from "../queries";
import type { FichaTecnicaParaPedido } from "../queries";
import {
  FORMA_PAGAMENTO_LABEL,
  STATUS_PEDIDO_LABEL,
  STATUS_PEDIDO_VARIANT,
  TIPO_PEDIDO_LABEL,
} from "../status";
import { FORMAS_PAGAMENTO } from "../validation";

export interface PedidoDetalheProps {
  detalhe: PedidoDetalhado;
  fichas: FichaTecnicaParaPedido[];
  caixaAberto: Tables<"caixas"> | null;
  trabalhosImpressao: Tables<"fila_impressao">[];
}

export function PedidoDetalhe({ detalhe, fichas, caixaAberto, trabalhosImpressao }: PedidoDetalheProps) {
  const router = useRouter();
  const { pedido, itens, pagamentos, historico } = detalhe;
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const editavel = pedido.status === "rascunho";
  const fichasItens = fichas.filter((f) => !f.disponivel_como_adicional);
  const fichasAdicionais = fichas.filter((f) => f.disponivel_como_adicional);

  const [novoItemFichaId, setNovoItemFichaId] = useState<string | null>(null);
  const [novoItemQtd, setNovoItemQtd] = useState<number | null>(1);

  const [descontoPercentual, setDescontoPercentual] = useState<number | null>(pedido.desconto_percentual);
  const [descontoValorFixo, setDescontoValorFixo] = useState<number | null>(pedido.desconto_valor_fixo);
  const [acrescimoValor, setAcrescimoValor] = useState<number | null>(pedido.acrescimo_valor);
  const [taxaEntrega, setTaxaEntrega] = useState<number | null>(pedido.taxa_entrega);

  const [formaPagamento, setFormaPagamento] = useState<(typeof FORMAS_PAGAMENTO)[number]>("dinheiro");
  const [valorPagamento, setValorPagamento] = useState<number | null>(pedido.total);
  const [trocoPara, setTrocoPara] = useState<number | null>(null);

  const totalPago = pagamentos.reduce((soma, p) => soma + p.valor, 0);
  const totalPreview = calcularTotalPedido({
    subtotal: pedido.subtotal,
    descontoPercentual: descontoPercentual ?? 0,
    descontoValorFixo: descontoValorFixo ?? 0,
    acrescimoValor: acrescimoValor ?? 0,
    taxaEntrega: taxaEntrega ?? 0,
  });

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

  const [confirmandoCancelamento, setConfirmandoCancelamento] = useState(false);

  function handleDuplicar() {
    rodar(async () => {
      const novoId = await duplicarPedido(pedido.id);
      router.push(`/pedidos/${novoId}`);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {erro && (
        <Text size="sm" tone="danger">
          {erro}
        </Text>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={STATUS_PEDIDO_VARIANT[pedido.status] ?? "outline"}>
          {STATUS_PEDIDO_LABEL[pedido.status] ?? pedido.status}
        </Badge>
        <Text tone="muted">{TIPO_PEDIDO_LABEL[pedido.tipo] ?? pedido.tipo}</Text>
        {pedido.clientes && <Text tone="muted">Cliente: {pedido.clientes.nome}</Text>}
        {pedido.canais_venda && <Text tone="muted">Canal: {pedido.canais_venda.nome}</Text>}
      </div>

      <div className="flex flex-wrap gap-2">
        {pedido.status === "rascunho" && (
          <Button disabled={pending || itens.length === 0} onClick={() => rodar(() => confirmarPedido(pedido.id))}>
            Confirmar pedido
          </Button>
        )}
        {pedido.status === "confirmado" && (
          <Button disabled={pending} onClick={() => rodar(() => iniciarPreparoPedido(pedido.id))}>
            Iniciar preparo
          </Button>
        )}
        {pedido.status === "em_preparo" && (
          <Button disabled={pending} onClick={() => rodar(() => avancarStatusPedido(pedido.id, "em_preparo"))}>
            Marcar pronto
          </Button>
        )}
        {pedido.status === "pronto" && pedido.tipo === "entrega" && (
          <Button disabled={pending} onClick={() => rodar(() => avancarStatusPedido(pedido.id, "pronto"))}>
            Saiu para entrega
          </Button>
        )}
        {(pedido.status === "pronto" || pedido.status === "saiu_para_entrega") &&
          !(pedido.status === "pronto" && pedido.tipo === "entrega") && (
            <Button disabled={pending} onClick={() => rodar(() => concluirPedido(pedido.id))}>
              Concluir pedido
            </Button>
          )}
        {pedido.status === "saiu_para_entrega" && (
          <Button disabled={pending} onClick={() => rodar(() => concluirPedido(pedido.id))}>
            Concluir pedido
          </Button>
        )}
        {pedido.status !== "cancelado" && pedido.status !== "entregue" && (
          <Button variant="ghost" disabled={pending} onClick={() => setConfirmandoCancelamento(true)}>
            Cancelar pedido
          </Button>
        )}
        <Button variant="outline" disabled={pending} onClick={handleDuplicar}>
          Duplicar pedido
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        <Text weight="medium">Itens</Text>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Qtd</TableHead>
              <TableHead className="text-right">Preço</TableHead>
              <TableHead className="text-right">Total</TableHead>
              {editavel && <TableHead className="text-right">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {itens.map((item) => (
              <ItemPedidoRow
                key={item.id}
                item={item}
                editavel={editavel}
                pedidoId={pedido.id}
                fichasAdicionais={fichasAdicionais}
                pending={pending}
                onErro={setErro}
                onMudanca={() => router.refresh()}
              />
            ))}
          </TableBody>
        </Table>

        {editavel && (
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <Text size="sm" tone="muted">
                Adicionar item
              </Text>
              <Combobox
                className="w-64"
                options={fichasItens.map((f) => ({
                  value: f.id,
                  label: f.nome,
                  description: formatarMoeda(f.preco_venda_praticado ?? f.preco_sugerido ?? 0),
                }))}
                value={novoItemFichaId}
                onValueChange={setNovoItemFichaId}
                placeholder="Selecionar item..."
                searchPlaceholder="Buscar..."
                emptyMessage="Nenhuma ficha técnica disponível."
              />
            </div>
            <NumberField className="w-24" value={novoItemQtd} onChange={setNovoItemQtd} min={0} placeholder="Qtd" />
            <Button
              type="button"
              variant="outline"
              disabled={pending || !novoItemFichaId || !novoItemQtd}
              onClick={() => {
                const ficha = fichasItens.find((f) => f.id === novoItemFichaId);
                if (!ficha || !novoItemQtd) return;
                rodar(async () => {
                  await adicionarItemPedido(pedido.id, {
                    fichaTecnicaId: ficha.id,
                    quantidade: novoItemQtd,
                    precoUnitarioPraticado: ficha.preco_venda_praticado ?? ficha.preco_sugerido ?? 0,
                  });
                  setNovoItemFichaId(null);
                  setNovoItemQtd(1);
                });
              }}
            >
              Adicionar
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <Text weight="medium">Valores</Text>
          <div className="flex justify-between">
            <Text tone="muted">Subtotal</Text>
            <Text>{formatarMoeda(pedido.subtotal)}</Text>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Text size="sm" tone="muted">
                Desconto %
              </Text>
              <PercentInput
                value={descontoPercentual}
                onChange={setDescontoPercentual}
                min={0}
                max={100}
                disabled={!editavel}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Text size="sm" tone="muted">
                Desconto R$
              </Text>
              <CurrencyInput value={descontoValorFixo} onChange={setDescontoValorFixo} min={0} disabled={!editavel} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Text size="sm" tone="muted">
                Acréscimo R$
              </Text>
              <CurrencyInput value={acrescimoValor} onChange={setAcrescimoValor} min={0} disabled={!editavel} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Text size="sm" tone="muted">
                Taxa de entrega R$
              </Text>
              <CurrencyInput value={taxaEntrega} onChange={setTaxaEntrega} min={0} disabled={!editavel} />
            </div>
          </div>
          {editavel && (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() =>
                rodar(() =>
                  atualizarValoresPedido(pedido.id, {
                    descontoPercentual: descontoPercentual ?? 0,
                    descontoValorFixo: descontoValorFixo ?? 0,
                    acrescimoValor: acrescimoValor ?? 0,
                    taxaEntrega: taxaEntrega ?? 0,
                  }),
                )
              }
            >
              Salvar valores
            </Button>
          )}
          <div className="flex justify-between border-t pt-2">
            <Text weight="medium">Total</Text>
            <Text weight="medium">{formatarMoeda(editavel ? totalPreview : pedido.total)}</Text>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Text weight="medium">Pagamentos</Text>
          {pagamentos.length === 0 ? (
            <Text tone="muted" size="sm">
              Nenhum pagamento registrado.
            </Text>
          ) : (
            <div className="flex flex-col gap-1">
              {pagamentos.map((pagamento) => (
                <div key={pagamento.id} className="flex justify-between text-sm">
                  <Text tone="muted">{FORMA_PAGAMENTO_LABEL[pagamento.forma_pagamento] ?? pagamento.forma_pagamento}</Text>
                  <Text>{formatarMoeda(pagamento.valor)}</Text>
                </div>
              ))}
              <div className="flex justify-between border-t pt-1 text-sm">
                <Text tone="muted">Total pago</Text>
                <Text>{formatarMoeda(totalPago)}</Text>
              </div>
              <div className="flex justify-between text-sm">
                <Text tone="muted">Restante</Text>
                <Text>{formatarMoeda(Math.max(0, pedido.total - totalPago))}</Text>
              </div>
            </div>
          )}

          {pedido.status !== "cancelado" && (
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1.5">
                <Text size="sm" tone="muted">
                  Forma
                </Text>
                <Select
                  className="w-40"
                  value={formaPagamento}
                  onChange={(event) => setFormaPagamento(event.target.value as (typeof FORMAS_PAGAMENTO)[number])}
                >
                  {FORMAS_PAGAMENTO.map((forma) => (
                    <option key={forma} value={forma}>
                      {FORMA_PAGAMENTO_LABEL[forma]}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Text size="sm" tone="muted">
                  Valor
                </Text>
                <CurrencyInput className="w-32" value={valorPagamento} onChange={setValorPagamento} min={0} />
              </div>
              {formaPagamento === "dinheiro" && (
                <div className="flex flex-col gap-1.5">
                  <Text size="sm" tone="muted">
                    Troco para
                  </Text>
                  <CurrencyInput className="w-32" value={trocoPara} onChange={setTrocoPara} min={0} />
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                disabled={pending || !valorPagamento}
                onClick={() =>
                  rodar(() =>
                    registrarPagamentoPedido(pedido.id, {
                      formaPagamento,
                      valor: valorPagamento,
                      trocoPara: formaPagamento === "dinheiro" ? trocoPara : null,
                      caixaId: caixaAberto?.id ?? null,
                    }),
                  )
                }
              >
                Registrar pagamento
              </Button>
            </div>
          )}
          {!caixaAberto && (
            <Text size="sm" tone="muted">
              Nenhum caixa aberto — o pagamento será registrado sem vínculo com caixa.
            </Text>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Text weight="medium">Histórico</Text>
        <div className="flex flex-col gap-1">
          {historico.map((linha) => (
            <div key={linha.id} className="flex justify-between text-sm">
              <Text tone="muted">
                {linha.status_anterior ? `${STATUS_PEDIDO_LABEL[linha.status_anterior] ?? linha.status_anterior} → ` : ""}
                {STATUS_PEDIDO_LABEL[linha.status_novo] ?? linha.status_novo}
                {linha.motivo ? ` (${linha.motivo})` : ""}
              </Text>
              <Text tone="muted">{formatarDataHora(linha.criado_em)}</Text>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Text weight="medium">Impressão</Text>
        <FilaImpressaoLista trabalhos={trabalhosImpressao} empresaId={pedido.empresa_id} />
      </div>

      <ConfirmDialog
        open={confirmandoCancelamento}
        onOpenChange={setConfirmandoCancelamento}
        title="Cancelar pedido"
        description="Se o estoque já foi consumido para este pedido, ele será estornado automaticamente. Esta ação não pode ser desfeita."
        confirmLabel="Cancelar pedido"
        cancelLabel="Voltar"
        destructive
        requireReason
        reasonLabel="Motivo do cancelamento"
        onConfirm={async (motivo) => {
          await cancelarPedido(pedido.id, { motivo });
          router.refresh();
        }}
      />
    </div>
  );
}

interface ItemPedidoRowProps {
  item: PedidoDetalhado["itens"][number];
  editavel: boolean;
  pedidoId: string;
  fichasAdicionais: FichaTecnicaParaPedido[];
  pending: boolean;
  onErro: (mensagem: string) => void;
  onMudanca: () => void;
}

function ItemPedidoRow({ item, editavel, pedidoId, fichasAdicionais, pending, onErro, onMudanca }: ItemPedidoRowProps) {
  const [, startTransition] = useTransition();
  const [qtd, setQtd] = useState<number | null>(item.quantidade);
  const [adicionandoAdicional, setAdicionandoAdicional] = useState(false);
  const [adicionalFichaId, setAdicionalFichaId] = useState<string | null>(null);

  function rodar(acao: () => Promise<void>) {
    startTransition(async () => {
      try {
        await acao();
        onMudanca();
      } catch (error) {
        onErro(error instanceof Error ? error.message : "Não foi possível concluir a ação.");
      }
    });
  }

  return (
    <>
      <TableRow>
        <TableCell className="text-foreground font-medium">{item.fichas_tecnicas.nome}</TableCell>
        <TableCell>
          {editavel ? (
            <NumberField
              className="w-20"
              value={qtd}
              onChange={(valor) => {
                setQtd(valor);
                if (valor && valor > 0) rodar(() => atualizarQuantidadeItem(pedidoId, item.id, valor));
              }}
              min={0}
            />
          ) : (
            item.quantidade
          )}
        </TableCell>
        <TableCell className="text-right">{formatarMoeda(item.preco_unitario_praticado)}</TableCell>
        <TableCell className="text-right">{formatarMoeda(item.valor_total ?? 0)}</TableCell>
        {editavel && (
          <TableCell className="text-right">
            <div className="flex justify-end gap-1">
              <Button variant="ghost" size="sm" disabled={pending} onClick={() => setAdicionandoAdicional((v) => !v)}>
                + adicional
              </Button>
              <Button variant="ghost" size="sm" disabled={pending} onClick={() => rodar(() => removerItemPedido(pedidoId, item.id))}>
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Remover</span>
              </Button>
            </div>
          </TableCell>
        )}
      </TableRow>

      {item.pedido_item_adicionais.map((adicional) => (
        <TableRow key={adicional.id}>
          <TableCell className="text-muted-foreground pl-6 text-sm">+ {adicional.fichas_tecnicas.nome}</TableCell>
          <TableCell className="text-muted-foreground text-sm">{adicional.quantidade}</TableCell>
          <TableCell className="text-muted-foreground text-right text-sm">
            {formatarMoeda(adicional.preco_unitario_praticado)}
          </TableCell>
          <TableCell className="text-muted-foreground text-right text-sm">
            {formatarMoeda(adicional.valor_total ?? 0)}
          </TableCell>
          {editavel && (
            <TableCell className="text-right">
              <Button variant="ghost" size="sm" disabled={pending} onClick={() => rodar(() => removerAdicionalItem(pedidoId, adicional.id))}>
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Remover adicional</span>
              </Button>
            </TableCell>
          )}
        </TableRow>
      ))}

      {adicionandoAdicional && editavel && (
        <TableRow>
          <TableCell colSpan={5}>
            <div className="flex items-center gap-2 pl-6">
              <Combobox
                className="w-56"
                options={fichasAdicionais.map((f) => ({ value: f.id, label: f.nome }))}
                value={adicionalFichaId}
                onValueChange={setAdicionalFichaId}
                placeholder="Selecionar adicional..."
                searchPlaceholder="Buscar..."
                emptyMessage="Nenhum adicional cadastrado."
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!adicionalFichaId}
                onClick={() => {
                  const ficha = fichasAdicionais.find((f) => f.id === adicionalFichaId);
                  if (!ficha) return;
                  rodar(async () => {
                    await adicionarAdicionalItem(pedidoId, item.id, {
                      fichaTecnicaId: ficha.id,
                      quantidade: 1,
                      precoUnitarioPraticado: ficha.preco_venda_praticado ?? ficha.preco_sugerido ?? 0,
                    });
                    setAdicionandoAdicional(false);
                    setAdicionalFichaId(null);
                  });
                }}
              >
                Adicionar
              </Button>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
