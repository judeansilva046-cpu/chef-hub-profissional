import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { Heading } from "@/components/ui/heading";
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
import { ConsentimentoLgpdToggle } from "@/features/clientes/components/consentimento-lgpd-toggle";
import {
  buscarClientePorId,
  buscarEstatisticasCliente,
} from "@/features/clientes/queries";
import { InteracoesCard } from "@/features/comunicacao/components/interacoes-card";
import { CuponsUtilizadosCard } from "@/features/cupons/components/cupons-utilizados-card";
import { ExtratoCashbackCard } from "@/features/cashback/components/extrato-cashback-card";
import { ExtratoPontosCard } from "@/features/fidelidade/components/extrato-pontos-card";
import { NovaTarefaDialog } from "@/features/tarefas/components/nova-tarefa-dialog";
import { TarefasTable } from "@/features/tarefas/components/tarefas-table";
import { listarTarefasPorReferencia } from "@/features/tarefas/queries";
import { formatarData, formatarDecimal, formatarMoeda } from "@/lib/format";

interface ClienteDetalhePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ClienteDetalhePageProps): Promise<Metadata> {
  const { id } = await params;
  const cliente = await buscarClientePorId(id);
  return { title: `${cliente?.nome ?? "Cliente"} — Chef Hub Profissional` };
}

export default async function ClienteDetalhePage({
  params,
}: ClienteDetalhePageProps) {
  const { id } = await params;
  const cliente = await buscarClientePorId(id);
  if (!cliente) notFound();

  const [estatisticas, tarefas] = await Promise.all([
    buscarEstatisticasCliente(id),
    listarTarefasPorReferencia("cliente", id),
  ]);

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <Link
            href="/clientes"
            className="text-muted-foreground hover:text-foreground mb-2 inline-flex items-center gap-1 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para clientes
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <Heading level={2}>{cliente.nome}</Heading>
            <Badge variant={cliente.ativo ? "success" : "outline"}>
              {cliente.ativo ? "Ativo" : "Inativo"}
            </Badge>
            {cliente.segmento && <Badge variant="info">{cliente.segmento}</Badge>}
            {cliente.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
          <div className="text-muted-foreground mt-2 flex flex-wrap gap-4 text-sm">
            {cliente.telefone && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-4 w-4" />
                {cliente.telefone}
              </span>
            )}
            {cliente.whatsapp && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-4 w-4" />
                WhatsApp: {cliente.whatsapp}
              </span>
            )}
            {cliente.email && (
              <span className="flex items-center gap-1.5">
                <Mail className="h-4 w-4" />
                {cliente.email}
              </span>
            )}
            {cliente.endereco && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {cliente.endereco}
              </span>
            )}
          </div>
          <div className="mt-2">
            <ConsentimentoLgpdToggle
              clienteId={cliente.id}
              consentimento={cliente.consentimento_lgpd}
              consentimentoEm={cliente.consentimento_lgpd_em}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                Total gasto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Text className="text-2xl font-semibold">
                {formatarMoeda(estatisticas.totalGasto)}
              </Text>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                Ticket médio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Text className="text-2xl font-semibold">
                {formatarMoeda(estatisticas.ticketMedio)}
              </Text>
              <Text tone="muted" size="sm">
                {formatarDecimal(estatisticas.quantidadeCompras)} pedido(s)
              </Text>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                Última compra
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Text className="text-2xl font-semibold">
                {estatisticas.ultimaCompra
                  ? formatarData(estatisticas.ultimaCompra)
                  : "—"}
              </Text>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">Produtos favoritos</CardTitle>
            </CardHeader>
            <CardContent>
              {estatisticas.produtosFavoritos.length === 0 ? (
                <Text tone="muted" size="sm">
                  Sem compras suficientes ainda.
                </Text>
              ) : (
                <ul className="flex flex-col gap-1">
                  {estatisticas.produtosFavoritos.map((produto) => (
                    <li key={produto.nome} className="flex justify-between text-sm">
                      <span>{produto.nome}</span>
                      <span className="text-muted-foreground">{formatarDecimal(produto.quantidade)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">Canal preferido</CardTitle>
            </CardHeader>
            <CardContent>
              <Text className="text-2xl font-semibold">{estatisticas.canalPreferido ?? "—"}</Text>
            </CardContent>
          </Card>
        </div>

        {(cliente.preferencias || cliente.observacoes || cliente.restricoes_alimentares || cliente.origem) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preferências e observações</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {cliente.origem && (
                <Text size="sm">
                  <Text as="span" weight="semibold">
                    Origem:
                  </Text>{" "}
                  {cliente.origem}
                </Text>
              )}
              {cliente.restricoes_alimentares && (
                <Text size="sm">
                  <Text as="span" weight="semibold">
                    Restrições alimentares:
                  </Text>{" "}
                  {cliente.restricoes_alimentares}
                </Text>
              )}
              {cliente.preferencias && (
                <Text size="sm">
                  <Text as="span" weight="semibold">
                    Preferências:
                  </Text>{" "}
                  {cliente.preferencias}
                </Text>
              )}
              {cliente.observacoes && (
                <Text size="sm">
                  <Text as="span" weight="semibold">
                    Observações:
                  </Text>{" "}
                  {cliente.observacoes}
                </Text>
              )}
            </CardContent>
          </Card>
        )}

        <div className="min-w-0">
          <Heading level={3} className="mb-3">
            Histórico de pedidos
          </Heading>
          {estatisticas.pedidos.length === 0 ? (
            <EmptyState
              title="Nenhum pedido registrado"
              description="As vendas registradas para este cliente aparecerão aqui."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Ficha técnica</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estatisticas.pedidos.map((pedido) => (
                  <TableRow key={pedido.id}>
                    <TableCell className="text-muted-foreground">
                      {formatarData(pedido.dataVenda)}
                    </TableCell>
                    <TableCell className="text-foreground font-medium">
                      {pedido.fichaTecnicaNome}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {pedido.canalNome ?? "—"}
                    </TableCell>
                    <TableCell>{formatarDecimal(pedido.quantidade)}</TableCell>
                    <TableCell className="text-right">
                      {formatarMoeda(pedido.valorTotal)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="grid min-w-0 gap-4 lg:grid-cols-2">
          <ExtratoPontosCard clienteId={id} />
          <ExtratoCashbackCard clienteId={id} />
        </div>

        <CuponsUtilizadosCard clienteId={id} />

        <InteracoesCard clienteId={id} />

        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between">
            <Heading level={3}>Tarefas</Heading>
            <NovaTarefaDialog referenciaTipo="cliente" referenciaId={id} />
          </div>
          <TarefasTable tarefas={tarefas} />
        </div>
      </Container>
    </Section>
  );
}
