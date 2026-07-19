import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { Heading } from "@/components/ui/heading";
import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { Section } from "@/components/ui/section";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Text } from "@/components/ui/text";
import { CRM_SUB_NAV_LINKS } from "@/features/crm/components/crm-sub-nav-links";
import {
  type ChaveSegmento,
  type CriteriosSegmentoPersonalizado,
  SEGMENTO_LABEL,
  avaliarSegmentoPersonalizado,
  calcularLimiarVip,
  calcularSegmentosCliente,
  calcularTicketMedioGeral,
} from "@/features/crm-segmentacao/calculations";
import { NovoSegmentoDialog } from "@/features/crm-segmentacao/components/novo-segmento-dialog";
import { SegmentoPersonalizadoAcoes } from "@/features/crm-segmentacao/components/segmentos-personalizados-toggle";
import { buscarClientesComMetricas, listarSegmentosPersonalizados } from "@/features/crm-segmentacao/queries";
import { formatarData, formatarMoeda } from "@/lib/format";

export const metadata: Metadata = {
  title: "Segmentação — CRM — Chef Hub Profissional",
};

const SEGMENTOS_AUTOMATICOS: ChaveSegmento[] = [
  "novo",
  "recorrente",
  "inativo",
  "vip",
  "alto_ticket",
  "baixa_frequencia",
  "risco_abandono",
  "aniversariante",
];

interface SegmentacaoPageProps {
  searchParams: Promise<{ segmento?: string; personalizado?: string }>;
}

export default async function SegmentacaoPage({ searchParams }: SegmentacaoPageProps) {
  const params = await searchParams;
  const [clientes, segmentosPersonalizados] = await Promise.all([
    buscarClientesComMetricas(),
    listarSegmentosPersonalizados(),
  ]);

  const contexto = {
    limiarVip: calcularLimiarVip(clientes),
    ticketMedioGeral: calcularTicketMedioGeral(clientes),
  };

  const segmentosPorCliente = new Map(
    clientes.map((cliente) => [cliente.id, calcularSegmentosCliente(cliente, contexto)]),
  );

  const contagemPorSegmento = new Map<ChaveSegmento, number>();
  for (const segmentos of segmentosPorCliente.values()) {
    for (const segmento of segmentos) {
      contagemPorSegmento.set(segmento, (contagemPorSegmento.get(segmento) ?? 0) + 1);
    }
  }

  const segmentoSelecionado = SEGMENTOS_AUTOMATICOS.includes(params.segmento as ChaveSegmento)
    ? (params.segmento as ChaveSegmento)
    : null;
  const personalizadoSelecionado = params.personalizado
    ? segmentosPersonalizados.find((segmento) => segmento.id === params.personalizado)
    : null;

  let clientesFiltrados = clientes;
  if (segmentoSelecionado) {
    clientesFiltrados = clientes.filter((cliente) =>
      segmentosPorCliente.get(cliente.id)?.includes(segmentoSelecionado),
    );
  } else if (personalizadoSelecionado) {
    clientesFiltrados = clientes.filter((cliente) =>
      avaliarSegmentoPersonalizado(
        cliente,
        (personalizadoSelecionado.criterios ?? {}) as CriteriosSegmentoPersonalizado,
      ),
    );
  }

  const tituloLista = segmentoSelecionado
    ? SEGMENTO_LABEL[segmentoSelecionado]
    : (personalizadoSelecionado?.nome ?? "Todos os clientes ativos");

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <Heading level={2}>CRM</Heading>
          <ModuleSubNav links={CRM_SUB_NAV_LINKS} className="mt-3" />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <a href="/api/crm/exportar/clientes?formato=xlsx" download className={buttonVariants({ variant: "outline", size: "sm" })}>
            Exportar Excel
          </a>
          <a href="/api/crm/exportar/clientes?formato=pdf" download className={buttonVariants({ variant: "outline", size: "sm" })}>
            Exportar PDF
          </a>
        </div>

        <div>
          <Text tone="muted">
            Segmentos automáticos calculados a partir do histórico de vendas
            — nenhum cliente é gravado em um segmento, a lista é sempre
            recalculada.
          </Text>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SEGMENTOS_AUTOMATICOS.map((chave) => (
            <Link key={chave} href={`/crm/segmentacao?segmento=${chave}`}>
              <Card
                className={
                  segmentoSelecionado === chave ? "border-primary" : undefined
                }
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-muted-foreground text-sm font-medium">
                    {SEGMENTO_LABEL[chave]}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Text className="text-2xl font-semibold">
                    {contagemPorSegmento.get(chave) ?? 0}
                  </Text>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Heading level={3}>Segmentos personalizados</Heading>
          <NovoSegmentoDialog />
        </div>

        {segmentosPersonalizados.length > 0 && (
          <div className="min-w-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {segmentosPersonalizados.map((segmento) => (
                  <TableRow key={segmento.id}>
                    <TableCell className="text-foreground font-medium">
                      <Link
                        href={`/crm/segmentacao?personalizado=${segmento.id}`}
                        className="hover:underline"
                      >
                        {segmento.nome}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {segmento.descricao ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={segmento.ativo ? "success" : "outline"}>
                        {segmento.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <SegmentoPersonalizadoAcoes id={segmento.id} ativo={segmento.ativo} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="min-w-0">
          <Heading level={3} className="mb-3">
            {tituloLista} ({clientesFiltrados.length})
          </Heading>
          {clientesFiltrados.length === 0 ? (
            <EmptyState
              title="Nenhum cliente neste segmento"
              description="Ajuste os critérios ou registre mais vendas para este segmento ter clientes."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Total gasto</TableHead>
                  <TableHead>Ticket médio</TableHead>
                  <TableHead>Compras</TableHead>
                  <TableHead>Última compra</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientesFiltrados.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell className="text-foreground font-medium">
                      <Link href={`/clientes/${cliente.id}`} className="hover:underline">
                        {cliente.nome}
                      </Link>
                    </TableCell>
                    <TableCell>{formatarMoeda(cliente.totalGasto)}</TableCell>
                    <TableCell>{formatarMoeda(cliente.ticketMedio)}</TableCell>
                    <TableCell>{cliente.quantidadeCompras}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {cliente.ultimaCompra ? formatarData(cliente.ultimaCompra) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Container>
    </Section>
  );
}
