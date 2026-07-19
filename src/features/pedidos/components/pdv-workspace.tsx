"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/number-field";
import { Select } from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { aplicarCupom } from "@/features/cupons/actions";
import type { Tables } from "@/lib/supabase/database.types";
import { formatarMoeda } from "@/lib/format";

import {
  adicionarItemPedido,
  atualizarQuantidadeItem,
  atualizarValoresPedido,
  criarPedido,
  finalizarVendaPdv,
  registrarPagamentoPedido,
  removerItemPedido,
} from "../actions";
import type { FichaTecnicaParaPedido, PedidoDetalhado } from "../queries";
import { FORMA_PAGAMENTO_LABEL } from "../status";
import { FORMAS_PAGAMENTO } from "../validation";

export interface PdvWorkspaceProps {
  fichas: FichaTecnicaParaPedido[];
  caixaAberto: Tables<"caixas"> | null;
  clientes: Tables<"clientes">[];
  canais: Tables<"canais_venda">[];
  pedidoAtual: PedidoDetalhado | null;
}

export function PdvWorkspace({ fichas, caixaAberto, clientes, canais, pedidoAtual }: PdvWorkspaceProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");

  const [clienteId, setClienteId] = useState<string | null>(pedidoAtual?.pedido.cliente_id ?? "");
  const [canalVendaId, setCanalVendaId] = useState<string | null>(pedidoAtual?.pedido.canal_venda_id ?? "");
  const [formaPagamento, setFormaPagamento] = useState<(typeof FORMAS_PAGAMENTO)[number]>("dinheiro");
  const [valorPagamento, setValorPagamento] = useState<number | null>(pedidoAtual?.pedido.total ?? null);
  const [trocoPara, setTrocoPara] = useState<number | null>(null);
  const [codigoCupom, setCodigoCupom] = useState("");
  const [cupomAplicado, setCupomAplicado] = useState<string | null>(null);

  const fichasItens = fichas.filter((f) => !f.disponivel_como_adicional);
  const fichasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return fichasItens;
    return fichasItens.filter((f) => f.nome.toLowerCase().includes(termo));
  }, [busca, fichasItens]);

  const itens = pedidoAtual?.itens ?? [];
  const pagamentos = pedidoAtual?.pagamentos ?? [];
  const totalPago = pagamentos.reduce((soma, p) => soma + p.valor, 0);
  const totalPedido = pedidoAtual?.pedido.total ?? 0;
  const podeFinalizarrar = itens.length > 0 && totalPago >= totalPedido && totalPedido > 0;

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

  function adicionarAoCarrinho(ficha: FichaTecnicaParaPedido) {
    setErro(null);
    startTransition(async () => {
      try {
        const preco = ficha.preco_venda_praticado ?? ficha.preco_sugerido ?? 0;
        if (!pedidoAtual) {
          const novoId = await criarPedido({
            tipo: "balcao",
            clienteId,
            canalVendaId,
            observacoes: "",
          });
          await adicionarItemPedido(novoId, {
            fichaTecnicaId: ficha.id,
            quantidade: 1,
            precoUnitarioPraticado: preco,
          });
          router.push(`/pdv?pedidoId=${novoId}`);
          return;
        }

        const itemExistente = itens.find((item) => item.ficha_tecnica_id === ficha.id);
        if (itemExistente) {
          await atualizarQuantidadeItem(pedidoAtual.pedido.id, itemExistente.id, itemExistente.quantidade + 1);
        } else {
          await adicionarItemPedido(pedidoAtual.pedido.id, {
            fichaTecnicaId: ficha.id,
            quantidade: 1,
            precoUnitarioPraticado: preco,
          });
        }
        router.refresh();
      } catch (error) {
        setErro(error instanceof Error ? error.message : "Não foi possível adicionar o item.");
      }
    });
  }

  function novaVenda() {
    router.push("/pdv");
  }

  /**
   * Cupom exige cliente identificado (o uso é sempre registrado por cliente,
   * ver fn_validar_e_aplicar_cupom, 0049) — aplica o desconto no MESMO campo
   * desconto_valor_fixo que a tela de valores do pedido já usa
   * (atualizarValoresPedido), sem introduzir um caminho de cálculo paralelo.
   * Só trata os tipos percentual/fixo aqui: frete_gratis/produto_gratis
   * exigiriam alterar taxa_entrega/itens do pedido e ficam fora desta
   * integração inicial (ver relatório da Sprint 07).
   */
  function aplicarCupomNoPedido() {
    if (!pedidoAtual || !clienteId || !codigoCupom.trim()) return;
    setErro(null);
    startTransition(async () => {
      try {
        const resultado = await aplicarCupom({
          codigo: codigoCupom.trim(),
          clienteId,
          valorCompra: pedidoAtual.pedido.subtotal,
          canalVendaId: canalVendaId || undefined,
        });

        if (resultado.tipo !== "percentual" && resultado.tipo !== "fixo") {
          setErro("Este tipo de cupom ainda não é aplicado automaticamente no PDV.");
          return;
        }

        await atualizarValoresPedido(pedidoAtual.pedido.id, {
          descontoPercentual: pedidoAtual.pedido.desconto_percentual,
          descontoValorFixo: resultado.valorDesconto,
          acrescimoValor: pedidoAtual.pedido.acrescimo_valor,
          taxaEntrega: pedidoAtual.pedido.taxa_entrega,
        });

        setCupomAplicado(codigoCupom.trim().toUpperCase());
        router.refresh();
      } catch (error) {
        setErro(error instanceof Error ? error.message : "Não foi possível aplicar o cupom.");
      }
    });
  }

  return (
    <div className="grid h-full grid-cols-1 md:grid-cols-[1fr_380px]">
      <div className="flex flex-col gap-4 overflow-auto p-4">
        <input
          type="search"
          placeholder="Buscar produto..."
          value={busca}
          onChange={(event) => setBusca(event.target.value)}
          className="border-input bg-background text-foreground placeholder:text-muted-foreground h-12 w-full rounded-md border px-4 text-base focus-visible:ring-2 focus-visible:outline-none"
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {fichasFiltradas.map((ficha) => (
            <button
              key={ficha.id}
              type="button"
              disabled={pending}
              onClick={() => adicionarAoCarrinho(ficha)}
              className="border-border bg-background hover:bg-secondary flex h-28 flex-col items-center justify-center gap-1 rounded-lg border p-3 text-center transition-colors disabled:opacity-50"
            >
              <Text size="sm" weight="medium" className="line-clamp-2">
                {ficha.nome}
              </Text>
              <Text size="sm" tone="muted">
                {formatarMoeda(ficha.preco_venda_praticado ?? ficha.preco_sugerido ?? 0)}
              </Text>
            </button>
          ))}
        </div>
      </div>

      <div className="border-border bg-background flex flex-col gap-4 border-t p-4 md:border-t-0 md:border-l">
        <div className="flex items-center justify-between">
          <Text weight="medium">{pedidoAtual ? `Pedido #${pedidoAtual.pedido.numero}` : "Novo pedido"}</Text>
          {pedidoAtual && (
            <Button variant="ghost" size="sm" onClick={novaVenda}>
              Nova venda
            </Button>
          )}
        </div>

        {!caixaAberto && (
          <Badge variant="warning" className="w-fit">
            Nenhum caixa aberto
          </Badge>
        )}

        {erro && (
          <Text size="sm" tone="danger">
            {erro}
          </Text>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Combobox
            options={[{ value: "", label: "Sem cliente" }, ...clientes.map((c) => ({ value: c.id, label: c.nome }))]}
            value={clienteId}
            onValueChange={setClienteId}
            placeholder="Cliente..."
            searchPlaceholder="Buscar..."
            emptyMessage="Nenhum cliente."
            disabled={Boolean(pedidoAtual)}
          />
          <Combobox
            options={[{ value: "", label: "Sem canal" }, ...canais.map((c) => ({ value: c.id, label: c.nome }))]}
            value={canalVendaId}
            onValueChange={setCanalVendaId}
            placeholder="Canal..."
            searchPlaceholder="Buscar..."
            emptyMessage="Nenhum canal."
            disabled={Boolean(pedidoAtual)}
          />
        </div>

        <div className="flex flex-1 flex-col gap-2 overflow-auto">
          {itens.length === 0 ? (
            <Text tone="muted" size="sm">
              Carrinho vazio — toque num produto para adicionar.
            </Text>
          ) : (
            itens.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2 text-sm">
                <div className="min-w-0 flex-1">
                  <Text size="sm" className="truncate">
                    {item.fichas_tecnicas.nome}
                  </Text>
                  <Text size="sm" tone="muted">
                    {formatarMoeda(item.preco_unitario_praticado)} un.
                  </Text>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => rodar(() => atualizarQuantidadeItem(pedidoAtual!.pedido.id, item.id, Math.max(1, item.quantidade - 1)))}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Text size="sm" className="w-6 text-center">
                    {item.quantidade}
                  </Text>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => rodar(() => atualizarQuantidadeItem(pedidoAtual!.pedido.id, item.id, item.quantidade + 1))}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => rodar(() => removerItemPedido(pedidoAtual!.pedido.id, item.id))}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <Text size="sm" weight="medium" className="w-16 text-right">
                  {formatarMoeda(item.valor_total ?? 0)}
                </Text>
              </div>
            ))
          )}
        </div>

        <div className="border-border flex flex-col gap-1 border-t pt-2">
          <div className="flex justify-between">
            <Text tone="muted">Subtotal</Text>
            <Text>{formatarMoeda(pedidoAtual?.pedido.subtotal ?? 0)}</Text>
          </div>
          <div className="flex justify-between">
            <Text weight="semibold">Total</Text>
            <Text weight="semibold">{formatarMoeda(totalPedido)}</Text>
          </div>
          {pagamentos.length > 0 && (
            <div className="flex justify-between">
              <Text tone="muted">Pago</Text>
              <Text>{formatarMoeda(totalPago)}</Text>
            </div>
          )}
          {pedidoAtual && (pedidoAtual.pedido.desconto_valor_fixo > 0 || pedidoAtual.pedido.desconto_percentual > 0) && (
            <div className="flex justify-between">
              <Text tone="success">Desconto{cupomAplicado ? ` (${cupomAplicado})` : ""}</Text>
              <Text tone="success">
                -{formatarMoeda(pedidoAtual.pedido.desconto_valor_fixo)}
              </Text>
            </div>
          )}
        </div>

        {pedidoAtual && (
          <div className="flex gap-2">
            <Input
              value={codigoCupom}
              onChange={(event) => setCodigoCupom(event.target.value)}
              placeholder="Código do cupom"
              disabled={!clienteId || pending}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              disabled={!clienteId || !codigoCupom.trim() || pending}
              onClick={aplicarCupomNoPedido}
            >
              Aplicar cupom
            </Button>
          </div>
        )}

        {pedidoAtual && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Select
                className="flex-1"
                value={formaPagamento}
                onChange={(event) => setFormaPagamento(event.target.value as (typeof FORMAS_PAGAMENTO)[number])}
              >
                {FORMAS_PAGAMENTO.map((forma) => (
                  <option key={forma} value={forma}>
                    {FORMA_PAGAMENTO_LABEL[forma]}
                  </option>
                ))}
              </Select>
              <CurrencyInput className="w-28" value={valorPagamento} onChange={setValorPagamento} min={0} />
            </div>
            {formaPagamento === "dinheiro" && (
              <CurrencyInput
                value={trocoPara}
                onChange={setTrocoPara}
                min={0}
                placeholder="Troco para (opcional)"
              />
            )}
            <Button
              type="button"
              variant="outline"
              disabled={pending || !valorPagamento}
              onClick={() =>
                rodar(() =>
                  registrarPagamentoPedido(pedidoAtual.pedido.id, {
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

            <Button
              type="button"
              size="lg"
              disabled={pending || !podeFinalizarrar}
              onClick={() =>
                startTransition(async () => {
                  try {
                    await finalizarVendaPdv(pedidoAtual.pedido.id);
                    router.push("/pdv");
                  } catch (error) {
                    setErro(error instanceof Error ? error.message : "Não foi possível finalizar a venda.");
                  }
                })
              }
            >
              Finalizar venda
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
