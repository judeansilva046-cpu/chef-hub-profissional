import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { ListaItensEditor } from "@/features/lista-compras/components/lista-itens-editor";
import { buscarListaPorId } from "@/features/lista-compras/queries";
import { listarFornecedoresAtivosParaSelecao } from "@/features/fornecedores/queries";
import { formatarData } from "@/lib/format";

interface ListaComprasPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ListaComprasPageProps): Promise<Metadata> {
  const { id } = await params;
  const lista = await buscarListaPorId(id);
  return {
    title: lista ? `${lista.nome} — Chef Hub Profissional` : "Lista de compras",
  };
}

export default async function ListaComprasDetalhePage({
  params,
}: ListaComprasPageProps) {
  const { id } = await params;
  const [lista, fornecedores] = await Promise.all([
    buscarListaPorId(id),
    listarFornecedoresAtivosParaSelecao(),
  ]);

  if (!lista) {
    notFound();
  }

  const convertida = lista.status === "convertida";

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Heading level={2}>{lista.nome}</Heading>
            <Badge variant={convertida ? "success" : "info"}>
              {convertida ? "Convertida em pedidos" : "Gerada"}
            </Badge>
          </div>
          <Text tone="muted">
            Período de referência: {formatarData(lista.data_inicio_referencia)}{" "}
            a {formatarData(lista.data_fim_referencia)}
          </Text>
        </div>

        {lista.listas_compra_itens.length === 0 ? (
          <Text tone="muted">
            Nenhuma necessidade de compra identificada para o período — sem
            produções planejadas e sem ingredientes abaixo do estoque mínimo.
          </Text>
        ) : (
          <ListaItensEditor lista={lista} fornecedores={fornecedores} />
        )}
      </Container>
    </Section>
  );
}
