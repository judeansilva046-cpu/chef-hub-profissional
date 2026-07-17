import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

export interface LinhaRelatorioVendas {
  id: string;
  dataVenda: string;
  fichaTecnicaNome: string;
  canalNome: string | null;
  clienteNome: string | null;
  quantidade: number;
  precoUnitario: number;
  custoUnitario: number;
  valorTotal: number;
  margemTotal: number;
}

/** Sem paginação: usada tanto pela tela do relatório quanto pela exportação CSV — a mesma consulta, o mesmo resultado. */
export async function relatorioVendas({
  dataInicio,
  dataFim,
  canalVendaId,
}: {
  dataInicio: string;
  dataFim: string;
  canalVendaId?: string;
}): Promise<LinhaRelatorioVendas[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  let query = supabase
    .from("vendas")
    .select(
      "id, data_venda, quantidade, preco_unitario_praticado, custo_unitario_snapshot, valor_total, margem_total, fichas_tecnicas(nome), canais_venda(nome), clientes(nome)",
    )
    .eq("empresa_id", empresa.id)
    .gte("data_venda", dataInicio)
    .lte("data_venda", dataFim);

  if (canalVendaId) query = query.eq("canal_venda_id", canalVendaId);

  const { data, error } = await query.order("data_venda", { ascending: false });
  if (error) throw error;

  return ((data ?? []) as unknown as Array<{
    id: string;
    data_venda: string;
    quantidade: number;
    preco_unitario_praticado: number;
    custo_unitario_snapshot: number;
    valor_total: number | null;
    margem_total: number | null;
    fichas_tecnicas: { nome: string } | null;
    canais_venda: { nome: string } | null;
    clientes: { nome: string } | null;
  }>).map((linha) => ({
    id: linha.id,
    dataVenda: linha.data_venda,
    fichaTecnicaNome: linha.fichas_tecnicas?.nome ?? "—",
    canalNome: linha.canais_venda?.nome ?? null,
    clienteNome: linha.clientes?.nome ?? null,
    quantidade: linha.quantidade,
    precoUnitario: linha.preco_unitario_praticado,
    custoUnitario: linha.custo_unitario_snapshot,
    valorTotal: linha.valor_total ?? 0,
    margemTotal: linha.margem_total ?? 0,
  }));
}

export interface LinhaRelatorioCompras {
  id: string;
  dataPedido: string;
  fornecedorNome: string;
  status: string;
  valorTotal: number;
}

export async function relatorioCompras({
  dataInicio,
  dataFim,
}: {
  dataInicio: string;
  dataFim: string;
}): Promise<LinhaRelatorioCompras[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pedidos_compra")
    .select("id, data_pedido, status, fornecedores(nome), pedidos_compra_itens(valor_total)")
    .eq("empresa_id", empresa.id)
    .gte("data_pedido", dataInicio)
    .lte("data_pedido", dataFim)
    .order("data_pedido", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as unknown as Array<{
    id: string;
    data_pedido: string;
    status: string;
    fornecedores: { nome: string } | null;
    pedidos_compra_itens: { valor_total: number | null }[];
  }>).map((linha) => ({
    id: linha.id,
    dataPedido: linha.data_pedido,
    fornecedorNome: linha.fornecedores?.nome ?? "—",
    status: linha.status,
    valorTotal: linha.pedidos_compra_itens.reduce(
      (total, item) => total + (item.valor_total ?? 0),
      0,
    ),
  }));
}
