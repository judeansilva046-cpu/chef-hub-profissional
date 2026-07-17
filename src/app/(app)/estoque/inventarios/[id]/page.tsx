import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { InventarioContagemForm } from "@/features/estoque/components/inventario-contagem-form";
import { buscarInventarioPorId } from "@/features/estoque/queries";
import type { ItemContagemFormState } from "@/features/estoque/types";
import { formatarDataHora } from "@/lib/format";

interface InventarioPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: InventarioPageProps): Promise<Metadata> {
  const { id } = await params;
  const inventario = await buscarInventarioPorId(id);
  return {
    title: inventario
      ? `${inventario.nome} — Chef Hub Profissional`
      : "Inventário",
  };
}

export default async function InventarioPage({ params }: InventarioPageProps) {
  const { id } = await params;
  const inventario = await buscarInventarioPorId(id);

  if (!inventario) {
    notFound();
  }

  const itens: ItemContagemFormState[] = inventario.estoque_inventario_itens
    .slice()
    .sort((a, b) => a.ingredientes.nome.localeCompare(b.ingredientes.nome))
    .map((item) => ({
      itemId: item.id,
      ingredienteNome: item.ingredientes.nome,
      unidadeSigla: item.ingredientes.unidades_medida.sigla,
      quantidadeSistema: item.quantidade_sistema,
      quantidadeContada: item.quantidade_contada,
    }));

  const concluido = inventario.status === "concluido";

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Heading level={2}>{inventario.nome}</Heading>
            <Badge variant={concluido ? "success" : "warning"}>
              {concluido ? "Concluído" : "Em andamento"}
            </Badge>
          </div>
          <Text tone="muted">
            Criado em {formatarDataHora(inventario.criado_em)}
            {inventario.concluido_em &&
              ` · Concluído em ${formatarDataHora(inventario.concluido_em)}`}
          </Text>
        </div>

        {itens.length === 0 ? (
          <Text tone="muted">
            Nenhum ingrediente ativo estava cadastrado no momento da criação
            deste inventário.
          </Text>
        ) : (
          <InventarioContagemForm
            inventarioId={inventario.id}
            itensIniciais={itens}
            readOnly={concluido}
          />
        )}
      </Container>
    </Section>
  );
}
