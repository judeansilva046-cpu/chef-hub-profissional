"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Sparkles, Trash2, UserPlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Text } from "@/components/ui/text";
import { formatarMoeda } from "@/lib/format";
import type { Tables } from "@/lib/supabase/database.types";

import {
  atualizarStatusCotacao,
  escolherMelhorPropostaCotacao,
  finalizarCotacao,
  removerFornecedorCotacao,
} from "../actions";
import type { CotacaoCompleta, CotacaoFornecedorDetalhe } from "../queries";
import { ConvidarFornecedorCotacaoDialog } from "./convidar-fornecedor-cotacao-dialog";
import { FinalizarCotacaoDialog } from "./finalizar-cotacao-dialog";
import { PropostaFornecedorDialog } from "./proposta-fornecedor-dialog";
import { COTACAO_FORNECEDOR_STATUS_LABEL, COTACAO_FORNECEDOR_STATUS_VARIANT } from "./status-badges";

export interface CotacaoDetalheProps {
  cotacao: CotacaoCompleta;
  fornecedoresDisponiveis: Tables<"fornecedores">[];
}

export function CotacaoDetalhe({ cotacao, fornecedoresDisponiveis }: CotacaoDetalheProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [convidarAberto, setConvidarAberto] = useState(false);
  const [propostaAlvo, setPropostaAlvo] = useState<CotacaoFornecedorDetalhe | null>(null);
  const [finalizarAlvo, setFinalizarAlvo] = useState<string | undefined>(undefined);
  const [finalizarAberto, setFinalizarAberto] = useState(false);
  const [autoConfirm, setAutoConfirm] = useState<{ fornecedorId: string; nome: string; total: number } | null>(null);

  const editavel = cotacao.status === "aberta" || cotacao.status === "em_andamento";
  const jaConvidadosIds = new Set(cotacao.fornecedores.map((f) => f.fornecedorId));
  const fornecedoresParaConvidar = fornecedoresDisponiveis.filter((f) => !jaConvidadosIds.has(f.id));

  function cancelar() {
    setErro(null);
    startTransition(async () => {
      try {
        await atualizarStatusCotacao(cotacao.id, "cancelada");
        router.refresh();
      } catch (error) {
        setErro(error instanceof Error ? error.message : "Não foi possível cancelar.");
      }
    });
  }

  function removerFornecedor(cf: CotacaoFornecedorDetalhe) {
    setErro(null);
    startTransition(async () => {
      try {
        await removerFornecedorCotacao(cf.id, cotacao.id);
        router.refresh();
      } catch (error) {
        setErro(error instanceof Error ? error.message : "Não foi possível remover o fornecedor.");
      }
    });
  }

  function abrirFinalizarManual(fornecedorId?: string) {
    setFinalizarAlvo(fornecedorId);
    setFinalizarAberto(true);
  }

  function finalizarAutomaticamente() {
    setErro(null);
    startTransition(async () => {
      const fornecedorId = await escolherMelhorPropostaCotacao(cotacao.id);
      if (!fornecedorId) {
        setErro(
          "Nenhum fornecedor cobriu todos os itens da cotação — escolha manualmente.",
        );
        return;
      }
      const fornecedor = cotacao.fornecedores.find((f) => f.fornecedorId === fornecedorId);
      if (!fornecedor) return;
      setAutoConfirm({ fornecedorId, nome: fornecedor.fornecedorNome, total: fornecedor.totalGeral });
    });
  }

  function confirmarAutomatica() {
    if (!autoConfirm) return;
    setErro(null);
    startTransition(async () => {
      try {
        const pedidoId = await finalizarCotacao(cotacao.id, autoConfirm.fornecedorId, null, true);
        setAutoConfirm(null);
        router.push(`/compras/pedidos/${pedidoId}`);
      } catch (error) {
        setErro(error instanceof Error ? error.message : "Não foi possível finalizar a cotação.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {editavel && (
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" disabled={pending} onClick={() => setConvidarAberto(true)}>
            <UserPlus className="h-4 w-4" />
            Convidar fornecedor
          </Button>
          <Button size="sm" disabled={pending} onClick={finalizarAutomaticamente}>
            <Sparkles className="h-4 w-4" />
            Finalizar automaticamente (menor custo)
          </Button>
          <Button size="sm" variant="outline" onClick={() => abrirFinalizarManual(undefined)} disabled={pending}>
            Finalizar manualmente
          </Button>
          <Button size="sm" variant="ghost" disabled={pending} onClick={cancelar}>
            Cancelar cotação
          </Button>
        </div>
      )}

      {erro && (
        <Text size="sm" tone="danger">
          {erro}
        </Text>
      )}

      {cotacao.fornecedores.length === 0 ? (
        <Text tone="muted" size="sm">
          Nenhum fornecedor convidado ainda.
        </Text>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                {cotacao.fornecedores.map((f) => (
                  <TableHead key={f.id}>
                    <div className="flex flex-col gap-1">
                      <span>{f.fornecedorNome}</span>
                      <Badge variant={COTACAO_FORNECEDOR_STATUS_VARIANT[f.status]} className="w-fit">
                        {COTACAO_FORNECEDOR_STATUS_LABEL[f.status] ?? f.status}
                      </Badge>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {cotacao.itens.map((item) => {
                const precosDoItem = cotacao.fornecedores
                  .map((f) => f.propostas.find((p) => p.cotacaoItemId === item.id)?.precoUnitario)
                  .filter((preco): preco is number => preco !== undefined);
                const menorPreco = precosDoItem.length > 0 ? Math.min(...precosDoItem) : null;

                return (
                  <TableRow key={item.id}>
                    <TableCell className="text-foreground font-medium">
                      {item.ingredienteNome}
                      <Text tone="muted" size="sm">
                        {item.quantidade} {item.unidadeSigla}
                      </Text>
                    </TableCell>
                    {cotacao.fornecedores.map((f) => {
                      const proposta = f.propostas.find((p) => p.cotacaoItemId === item.id);
                      return (
                        <TableCell key={f.id} className="text-muted-foreground">
                          {proposta ? (
                            <span className={proposta.precoUnitario === menorPreco ? "text-success font-medium" : ""}>
                              {formatarMoeda(proposta.precoUnitario)}
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}

              <TableRow>
                <TableCell className="text-muted-foreground text-sm">Frete</TableCell>
                {cotacao.fornecedores.map((f) => (
                  <TableCell key={f.id} className="text-muted-foreground text-sm">
                    {formatarMoeda(f.valorFrete)}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="text-muted-foreground text-sm">Impostos</TableCell>
                {cotacao.fornecedores.map((f) => (
                  <TableCell key={f.id} className="text-muted-foreground text-sm">
                    {formatarMoeda(f.valorImpostos)}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="text-foreground text-sm font-semibold">Total geral</TableCell>
                {cotacao.fornecedores.map((f) => (
                  <TableCell key={f.id} className="text-foreground text-sm font-semibold">
                    {formatarMoeda(f.totalGeral)}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell />
                {cotacao.fornecedores.map((f) => (
                  <TableCell key={f.id}>
                    <div className="flex flex-col gap-1">
                      <Button size="sm" variant="outline" onClick={() => setPropostaAlvo(f)} disabled={!editavel || pending}>
                        {f.itensRespondidos > 0 ? "Editar proposta" : "Registrar proposta"}
                      </Button>
                      {editavel && (
                        <Button size="sm" variant="ghost" onClick={() => abrirFinalizarManual(f.fornecedorId)} disabled={pending}>
                          Escolher este
                        </Button>
                      )}
                      {editavel && f.status !== "vencedor" && (
                        <Button size="sm" variant="ghost" onClick={() => removerFornecedor(f)} disabled={pending}>
                          <Trash2 className="h-4 w-4" />
                          Remover
                        </Button>
                      )}
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}

      <ConvidarFornecedorCotacaoDialog
        open={convidarAberto}
        onOpenChange={setConvidarAberto}
        cotacaoId={cotacao.id}
        fornecedoresDisponiveis={fornecedoresParaConvidar}
      />

      {propostaAlvo && (
        <PropostaFornecedorDialog
          open={Boolean(propostaAlvo)}
          onOpenChange={(open) => !open && setPropostaAlvo(null)}
          cotacaoId={cotacao.id}
          cotacaoFornecedor={propostaAlvo}
          itens={cotacao.itens}
        />
      )}

      <FinalizarCotacaoDialog
        open={finalizarAberto}
        onOpenChange={setFinalizarAberto}
        cotacaoId={cotacao.id}
        fornecedores={cotacao.fornecedores}
        fornecedorPreselecionadoId={finalizarAlvo}
      />

      <Dialog open={Boolean(autoConfirm)} onOpenChange={(open) => !open && setAutoConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar escolha automática</DialogTitle>
            <DialogDescription>
              {autoConfirm && (
                <>
                  Fornecedor com o menor custo total entre os que propuseram
                  todos os itens: <strong>{autoConfirm.nome}</strong> (
                  {formatarMoeda(autoConfirm.total)}). Um pedido de compra
                  (rascunho) será criado para ele.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={confirmarAutomatica} disabled={pending}>
              {pending ? "Finalizando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
