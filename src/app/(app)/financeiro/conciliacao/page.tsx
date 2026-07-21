import type { Metadata } from "next";

import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { FINANCEIRO_SUB_NAV_LINKS } from "@/features/financeiro/components/financeiro-sub-nav-links";
import { ConciliarButton } from "@/features/financeiro/components/conciliar-button";
import { formatarMoeda } from "@/lib/format";
import { listarTransacoesBancarias } from "@/features/financeiro/erp/queries";

export const metadata: Metadata = {
  title: "Conciliação — Chef Hub Profissional",
};

export default async function ConciliacaoPage() {
  const txs = await listarTransacoesBancarias({ limit: 80 });

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <ModuleSubNav links={FINANCEIRO_SUB_NAV_LINKS} />
        <div>
          <Heading level={2}>Conciliação bancária</Heading>
          <Text tone="muted">
            PIX, cartão, dinheiro, delivery e marketplace — marque como
            conciliado.
          </Text>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="text-muted-foreground border-b">
                <th className="py-2 pr-3">Data</th>
                <th className="py-2 pr-3">Fonte</th>
                <th className="py-2 pr-3">Descrição</th>
                <th className="py-2 pr-3">Valor</th>
                <th className="py-2">Ação</th>
              </tr>
            </thead>
            <tbody>
              {txs.map((t) => (
                <tr key={t.id} className="border-b border-border">
                  <td className="py-2 pr-3">{t.tx_date}</td>
                  <td className="py-2 pr-3">
                    {t.source} / {t.tipo}
                  </td>
                  <td className="py-2 pr-3">{t.description}</td>
                  <td className="py-2 pr-3">{formatarMoeda(Number(t.amount))}</td>
                  <td className="py-2">
                    {t.reconciled ? (
                      <Text size="sm" tone="success">
                        Conciliado
                      </Text>
                    ) : (
                      <ConciliarButton id={t.id} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Container>
    </Section>
  );
}
