import type { Metadata } from "next";
import Link from "next/link";

import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { FINANCEIRO_SUB_NAV_LINKS } from "@/features/financeiro/components/financeiro-sub-nav-links";
import { primeiroDiaDoMesAtual, ultimoDiaDoMesAtual } from "@/lib/periodo";

export const metadata: Metadata = {
  title: "Relatórios ERP — Chef Hub Profissional",
};

const TIPOS = [
  { value: "dre", label: "DRE" },
  { value: "fluxo", label: "Fluxo de caixa" },
  { value: "receitas", label: "Receitas" },
  { value: "despesas", label: "Despesas" },
  { value: "lucro", label: "Lucro" },
  { value: "cmv", label: "CMV" },
  { value: "fornecedores", label: "Fornecedores (AP)" },
  { value: "clientes", label: "Clientes (AR)" },
] as const;

export default function RelatoriosErpPage() {
  const dataInicio = primeiroDiaDoMesAtual();
  const dataFim = ultimoDiaDoMesAtual();

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <ModuleSubNav links={FINANCEIRO_SUB_NAV_LINKS} />
        <div>
          <Heading level={2}>Relatórios financeiros</Heading>
          <Text tone="muted">
            Exportação PDF, Excel (SpreadsheetML) e CSV — período {dataInicio} →{" "}
            {dataFim}.
          </Text>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {TIPOS.map((tipo) => (
            <li key={tipo.value} className="border-border flex flex-col gap-2 border-b py-3">
              <Text weight="medium">{tipo.label}</Text>
              <div className="flex flex-wrap gap-3 text-sm">
                {(["csv", "pdf", "excel"] as const).map((fmt) => (
                  <Link
                    key={fmt}
                    className="text-primary underline-offset-2 hover:underline"
                    href={`/api/financeiro/reports?tipo=${tipo.value}&formato=${fmt}&dataInicio=${dataInicio}&dataFim=${dataFim}`}
                  >
                    {fmt.toUpperCase()}
                  </Link>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
