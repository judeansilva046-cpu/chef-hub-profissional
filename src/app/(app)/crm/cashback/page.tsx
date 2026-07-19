import type { Metadata } from "next";
import Link from "next/link";

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
import { ConfigCashbackForm } from "@/features/cashback/components/config-form";
import { ExtratoCashbackCard } from "@/features/cashback/components/extrato-cashback-card";
import { ProcessarExpiradosButton } from "@/features/cashback/components/processar-expirados-button";
import { buscarConfigCashback, listarClientesComSaldoCashback } from "@/features/cashback/queries";
import { CRM_SUB_NAV_LINKS } from "@/features/crm/components/crm-sub-nav-links";
import { formatarMoeda } from "@/lib/format";

export const metadata: Metadata = {
  title: "Cashback — CRM — Chef Hub Profissional",
};

interface CashbackPageProps {
  searchParams: Promise<{ clienteId?: string }>;
}

export default async function CashbackPage({ searchParams }: CashbackPageProps) {
  const params = await searchParams;
  const [config, clientesComSaldo] = await Promise.all([
    buscarConfigCashback(),
    listarClientesComSaldoCashback(),
  ]);

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <Heading level={2}>CRM</Heading>
          <ModuleSubNav links={CRM_SUB_NAV_LINKS} className="mt-3" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Text tone="muted">Cashback — creditado automaticamente a cada venda com cliente identificado.</Text>
          <ProcessarExpiradosButton />
        </div>

        <ConfigCashbackForm config={config} />

        <div>
          <Heading level={3} className="mb-3">
            Clientes com saldo de cashback
          </Heading>
          {clientesComSaldo.length === 0 ? (
            <EmptyState title="Nenhum cliente com cashback" description="Assim que uma venda gerar cashback, os clientes aparecerão aqui." />
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
                      <Link href={`/crm/cashback?clienteId=${cliente.id}`} className="hover:underline">
                        {cliente.nome}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">{formatarMoeda(cliente.saldo)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {params.clienteId && <ExtratoCashbackCard clienteId={params.clienteId} />}
      </Container>
    </Section>
  );
}
