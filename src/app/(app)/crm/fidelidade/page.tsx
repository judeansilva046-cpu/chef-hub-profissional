import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
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
import { ConfigFidelidadeForm } from "@/features/fidelidade/components/config-form";
import { ExtratoPontosCard } from "@/features/fidelidade/components/extrato-pontos-card";
import { NovoNivelDialog } from "@/features/fidelidade/components/novo-nivel-dialog";
import { ProcessarExpiradosButton } from "@/features/fidelidade/components/processar-expirados-button";
import {
  buscarConfigFidelidade,
  listarClientesComSaldoPontos,
  listarNiveisFidelidade,
} from "@/features/fidelidade/queries";
import { formatarDecimal } from "@/lib/format";

export const metadata: Metadata = {
  title: "Fidelidade — CRM — Chef Hub Profissional",
};

interface FidelidadePageProps {
  searchParams: Promise<{ clienteId?: string }>;
}

export default async function FidelidadePage({ searchParams }: FidelidadePageProps) {
  const params = await searchParams;
  const [config, niveis, clientesComSaldo] = await Promise.all([
    buscarConfigFidelidade(),
    listarNiveisFidelidade(),
    listarClientesComSaldoPontos(),
  ]);

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <Heading level={2}>CRM</Heading>
          <ModuleSubNav links={CRM_SUB_NAV_LINKS} className="mt-3" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Text tone="muted">Programa de pontos — concedidos automaticamente a cada venda com cliente identificado.</Text>
          <ProcessarExpiradosButton />
        </div>

        <ConfigFidelidadeForm config={config} />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Heading level={3}>Níveis</Heading>
          <NovoNivelDialog />
        </div>
        {niveis.length === 0 ? (
          <EmptyState title="Nenhum nível cadastrado" description="Crie níveis para recompensar clientes por faixa de pontos acumulados." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Pontos mínimos</TableHead>
                <TableHead>Benefícios</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {niveis.map((nivel) => (
                <TableRow key={nivel.id}>
                  <TableCell className="text-foreground font-medium">{nivel.nome}</TableCell>
                  <TableCell>{formatarDecimal(nivel.pontos_minimos)}</TableCell>
                  <TableCell className="text-muted-foreground">{nivel.beneficios ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={nivel.ativo ? "success" : "outline"}>
                      {nivel.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div>
          <Heading level={3} className="mb-3">
            Clientes com saldo de pontos
          </Heading>
          {clientesComSaldo.length === 0 ? (
            <EmptyState title="Nenhum cliente com pontos" description="Assim que uma venda gerar pontos, os clientes aparecerão aqui." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientesComSaldo.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell className="text-foreground font-medium">
                      <Link href={`/crm/fidelidade?clienteId=${cliente.id}`} className="hover:underline">
                        {cliente.nome}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">{formatarDecimal(cliente.saldo)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {params.clienteId && <ExtratoPontosCard clienteId={params.clienteId} />}
      </Container>
    </Section>
  );
}
