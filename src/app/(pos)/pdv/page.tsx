import type { Metadata } from "next";

import { buscarCaixaAbertoDoOperador } from "@/features/caixa/queries";
import { listarClientesAtivosParaSelecao } from "@/features/clientes/queries";
import { listarCanaisVenda } from "@/features/financeiro/queries";
import { PdvWorkspace } from "@/features/pedidos/components/pdv-workspace";
import { buscarPedidoDetalhado, listarFichasTecnicasParaPedido } from "@/features/pedidos/queries";

export const metadata: Metadata = {
  title: "PDV — Chef Hub Profissional",
};

interface PdvPageProps {
  searchParams: Promise<{ pedidoId?: string }>;
}

export default async function PdvPage({ searchParams }: PdvPageProps) {
  const { pedidoId } = await searchParams;

  const [fichas, caixaAberto, clientes, canais, detalhe] = await Promise.all([
    listarFichasTecnicasParaPedido(),
    buscarCaixaAbertoDoOperador(),
    listarClientesAtivosParaSelecao(),
    listarCanaisVenda(),
    pedidoId ? buscarPedidoDetalhado(pedidoId) : Promise.resolve(null),
  ]);

  const pedidoAtual = detalhe && detalhe.pedido.status === "rascunho" ? detalhe : null;

  return (
    <PdvWorkspace
      // Força remount ao trocar de pedido (ou voltar ao carrinho vazio):
      // sem isso, useState(pedidoAtual?.pedido.total) só roda no mount
      // inicial e nunca reflete o total do pedido criado depois — o botão
      // "Registrar pagamento" ficava com valor null (desabilitado) mesmo
      // com o carrinho preenchido, achado pelo teste E2E do PDV.
      key={pedidoAtual?.pedido.id ?? "novo"}
      fichas={fichas}
      caixaAberto={caixaAberto}
      clientes={clientes}
      canais={canais}
      pedidoAtual={pedidoAtual}
    />
  );
}
