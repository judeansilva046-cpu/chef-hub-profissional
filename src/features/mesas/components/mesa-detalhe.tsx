"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { NumberField } from "@/components/ui/number-field";
import { Select } from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import type { Tables } from "@/lib/supabase/database.types";
import { formatarMoeda } from "@/lib/format";

import { criarPedido } from "@/features/pedidos/actions";
import { STATUS_PEDIDO_LABEL, STATUS_PEDIDO_VARIANT } from "@/features/pedidos/status";

import { abrirComanda, fecharComanda, transferirComandaMesa, unirComandas } from "../actions";
import type { MesaDetalhada } from "../queries";

export interface MesaDetalheProps {
  detalhe: MesaDetalhada;
  mesasLivres: Tables<"mesas">[];
  comandasAbertas: (Tables<"comandas"> & { mesas: Pick<Tables<"mesas">, "id" | "identificador"> | null })[];
}

export function MesaDetalhe({ detalhe, mesasLivres, comandasAbertas }: MesaDetalheProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [quantidadePessoas, setQuantidadePessoas] = useState<number | null>(null);
  const [mesaDestinoId, setMesaDestinoId] = useState("");
  const [comandaDestinoId, setComandaDestinoId] = useState("");
  const [confirmandoFechamento, setConfirmandoFechamento] = useState(false);

  const { mesa, comandaAberta } = detalhe;

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

  function novoPedidoNaComanda() {
    if (!comandaAberta) return;
    setErro(null);
    startTransition(async () => {
      try {
        const id = await criarPedido({ tipo: "mesa", comandaId: comandaAberta.id });
        router.push(`/pedidos/${id}`);
      } catch (error) {
        setErro(error instanceof Error ? error.message : "Não foi possível criar o pedido.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Badge variant={mesa.status === "livre" ? "success" : "danger"}>{mesa.status}</Badge>
        {mesa.capacidade && <Text tone="muted">{mesa.capacidade} lugares</Text>}
      </div>

      {erro && (
        <Text size="sm" tone="danger">
          {erro}
        </Text>
      )}

      {!comandaAberta ? (
        <div className="flex items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Text size="sm" tone="muted">
              Pessoas (opcional)
            </Text>
            <NumberField className="w-28" value={quantidadePessoas} onChange={setQuantidadePessoas} min={1} />
          </div>
          <Button
            disabled={pending}
            onClick={() =>
              rodar(async () => {
                await abrirComanda(mesa.id, quantidadePessoas);
              })
            }
          >
            Abrir comanda
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Text weight="medium">Comanda aberta</Text>
            {comandaAberta.quantidade_pessoas && <Text tone="muted">{comandaAberta.quantidade_pessoas} pessoas</Text>}
          </div>

          <div className="flex flex-col gap-2">
            {comandaAberta.pedidos.length === 0 ? (
              <Text tone="muted" size="sm">
                Nenhum pedido nesta comanda ainda.
              </Text>
            ) : (
              comandaAberta.pedidos.map((pedido) => (
                <div key={pedido.id} className="flex items-center justify-between text-sm">
                  <Link href={`/pedidos/${pedido.id}`} className="hover:underline">
                    Pedido #{pedido.numero}
                  </Link>
                  <div className="flex items-center gap-2">
                    <Badge variant={STATUS_PEDIDO_VARIANT[pedido.status] ?? "outline"}>
                      {STATUS_PEDIDO_LABEL[pedido.status] ?? pedido.status}
                    </Badge>
                    <Text>{formatarMoeda(pedido.total)}</Text>
                  </div>
                </div>
              ))
            )}
          </div>

          <Button variant="outline" className="w-fit" disabled={pending} onClick={novoPedidoNaComanda}>
            Novo pedido nesta comanda
          </Button>

          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <Text size="sm" tone="muted">
                Transferir para
              </Text>
              <Select className="w-40" value={mesaDestinoId} onChange={(event) => setMesaDestinoId(event.target.value)}>
                <option value="">Selecionar mesa livre...</option>
                {mesasLivres.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.identificador}
                  </option>
                ))}
              </Select>
            </div>
            <Button
              variant="outline"
              disabled={pending || !mesaDestinoId}
              onClick={() =>
                rodar(async () => {
                  await transferirComandaMesa(comandaAberta.id, mesaDestinoId);
                  router.push(`/mesas/${mesaDestinoId}`);
                })
              }
            >
              Transferir
            </Button>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <Text size="sm" tone="muted">
                Unir com comanda de
              </Text>
              <Select className="w-40" value={comandaDestinoId} onChange={(event) => setComandaDestinoId(event.target.value)}>
                <option value="">Selecionar mesa...</option>
                {comandasAbertas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.mesas?.identificador ?? "—"}
                  </option>
                ))}
              </Select>
            </div>
            <Button
              variant="outline"
              disabled={pending || !comandaDestinoId}
              onClick={() =>
                rodar(async () => {
                  await unirComandas(comandaAberta.id, comandaDestinoId);
                  router.push(`/mesas/${comandasAbertas.find((c) => c.id === comandaDestinoId)?.mesa_id}`);
                })
              }
            >
              Unir (fecha esta mesa)
            </Button>
          </div>

          <Button variant="ghost" className="w-fit" disabled={pending} onClick={() => setConfirmandoFechamento(true)}>
            Fechar comanda
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={confirmandoFechamento}
        onOpenChange={setConfirmandoFechamento}
        title="Fechar comanda"
        description="Só é possível fechar quando todos os pedidos da comanda estiverem entregues ou cancelados."
        confirmLabel="Fechar comanda"
        destructive
        onConfirm={async () => {
          if (!comandaAberta) return;
          await fecharComanda(comandaAberta.id);
          router.refresh();
        }}
      />
    </div>
  );
}
