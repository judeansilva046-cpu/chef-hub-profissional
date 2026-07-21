import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { ESTOQUE_SUB_NAV_LINKS } from "@/features/estoque/components/estoque-sub-nav-links";
import { PerdaForm } from "@/features/estoque/inteligente/components/perda-form";
import { listarPerdasEstoque } from "@/features/estoque/inteligente/queries";
import { listarIngredientesAtivosParaSelecao } from "@/features/ingredientes/queries";
import { formatarMoeda } from "@/lib/format";

export const metadata: Metadata = {
  title: "Perdas de estoque — Chef Hub Profissional",
};

const REASON_LABEL: Record<string, string> = {
  quebra: "Quebra",
  vencimento: "Vencimento",
  desperdicio: "Desperdício",
  producao: "Produção",
  outro: "Outro",
};

export default async function PerdasEstoquePage() {
  const [ingredientes, perdas] = await Promise.all([
    listarIngredientesAtivosParaSelecao(),
    listarPerdasEstoque(80),
  ]);

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <Heading level={2}>Perdas e desperdício</Heading>
          <Text tone="muted">
            Registre quebra, vencimento, desperdício e perdas de produção com baixa automática.
          </Text>
        </div>

        <ModuleSubNav links={ESTOQUE_SUB_NAV_LINKS} />

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <PerdaForm ingredientes={ingredientes.map((i) => ({ id: i.id, nome: i.nome }))} />

          <div className="flex flex-col gap-3">
            <Text weight="semibold">Histórico recente</Text>
            {perdas.length === 0 ? (
              <Text size="sm" tone="muted">
                Nenhuma perda registrada.
              </Text>
            ) : (
              <ul className="flex flex-col gap-2">
                {perdas.map((p) => (
                  <li
                    key={p.id}
                    className="border-border bg-card flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm"
                  >
                    <span>
                      {REASON_LABEL[p.reason] ?? p.reason} · {p.quantity} · {p.lost_at}
                    </span>
                    <span className="text-muted-foreground">
                      {formatarMoeda(Number(p.quantity) * Number(p.unit_cost))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Container>
    </Section>
  );
}
