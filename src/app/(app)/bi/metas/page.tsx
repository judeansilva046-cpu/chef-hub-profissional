import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { criarBiMeta, desativarBiMeta } from "@/features/bi/actions";
import { BI_NAV } from "@/features/bi/bi-nav";
import { BiMetasPanel } from "@/features/bi/components/bi-metas-panel";
import { carregarBiDashboard, listarBiMetas } from "@/features/bi/queries";
import {
  dashboardsDoPapel,
  podeGerirMetasBi,
  podeLerBi,
} from "@/features/bi/permissions";
import type { BiMetaTipo } from "@/features/bi/types";
import {
  primeiroDiaDoMesAtual,
  ultimoDiaDoMesAtual,
} from "@/lib/periodo";
import { getPapelNaEmpresaAtual } from "@/server/auth/get-empresa-atual";
import { caminhoCasaDoPapel } from "@/server/auth/permissoes-rota";
import { requireEmpresaAtual } from "@/server/auth/require-empresa";

export const metadata: Metadata = {
  title: "BI Metas — Chef Hub Profissional",
};

const TIPOS: Array<{ id: BiMetaTipo; label: string }> = [
  { id: "faturamento", label: "Faturamento" },
  { id: "lucro", label: "Lucro" },
  { id: "cmv", label: "CMV" },
  { id: "ticket_medio", label: "Ticket médio" },
  { id: "vendas", label: "Vendas (qtd)" },
  { id: "desperdicio", label: "Desperdício" },
];

export default async function BiMetasPage() {
  await requireEmpresaAtual();
  const papel = await getPapelNaEmpresaAtual();
  if (!papel || !podeLerBi(papel)) {
    redirect(papel ? caminhoCasaDoPapel(papel) : "/dashboard");
  }

  const dataInicio = primeiroDiaDoMesAtual();
  const dataFim = ultimoDiaDoMesAtual();
  const [dash, metas] = await Promise.all([
    carregarBiDashboard({
      dashboard: "metas",
      dataInicio,
      dataFim,
    }),
    listarBiMetas({ inicio: dataInicio, fim: dataFim }),
  ]);

  const allowed = new Set(dashboardsDoPapel(papel));
  const links = BI_NAV.filter((l) => allowed.has(l.id)).map((l) => ({
    href: l.href,
    label: l.label,
    exact: l.href === "/bi",
  }));

  const podeGerir = podeGerirMetasBi(papel);

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <ModuleSubNav links={links} />
        <div>
          <Heading level={2}>Metas executivas</Heading>
          <Text tone="muted">
            Cadastre metas de faturamento, lucro, CMV, ticket, vendas e
            desperdício — progresso em tempo real no período.
          </Text>
        </div>

        <BiMetasPanel metas={dash.metas} />

        {podeGerir && (
          <form
            action={async (formData) => {
              "use server";
              await criarBiMeta({
                tipo: String(formData.get("tipo")) as BiMetaTipo,
                periodoInicio: String(formData.get("periodoInicio")),
                periodoFim: String(formData.get("periodoFim")),
                valorMeta: Number(formData.get("valorMeta")),
                unidade: String(formData.get("unidade")) as
                  | "BRL"
                  | "percent"
                  | "qty"
                  | "kg",
                observacao: String(formData.get("observacao") || "") || null,
              });
            }}
            className="border-border grid gap-3 rounded-lg border p-4 sm:grid-cols-2"
          >
            <Text weight="semibold" className="sm:col-span-2">
              Nova meta
            </Text>
            <label className="flex flex-col gap-1 text-sm">
              Tipo
              <select
                name="tipo"
                required
                className="border-border bg-background rounded-md border px-2 py-1.5"
              >
                {TIPOS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Unidade
              <select
                name="unidade"
                defaultValue="BRL"
                className="border-border bg-background rounded-md border px-2 py-1.5"
              >
                <option value="BRL">R$</option>
                <option value="percent">%</option>
                <option value="qty">Qtd</option>
                <option value="kg">kg</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Início
              <input
                type="date"
                name="periodoInicio"
                required
                defaultValue={dataInicio}
                className="border-border bg-background rounded-md border px-2 py-1.5"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Fim
              <input
                type="date"
                name="periodoFim"
                required
                defaultValue={dataFim}
                className="border-border bg-background rounded-md border px-2 py-1.5"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Valor meta
              <input
                type="number"
                name="valorMeta"
                step="0.01"
                min="0"
                required
                className="border-border bg-background rounded-md border px-2 py-1.5"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Observação
              <input
                name="observacao"
                className="border-border bg-background rounded-md border px-2 py-1.5"
              />
            </label>
            <div className="sm:col-span-2">
              <Button type="submit" size="sm">
                Salvar meta
              </Button>
            </div>
          </form>
        )}

        {podeGerir && metas.length > 0 && (
          <div className="border-border rounded-lg border p-4">
            <Text weight="semibold">Metas ativas</Text>
            <ul className="mt-2 flex flex-col gap-2">
              {metas.map((m) => (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-2 text-sm"
                >
                  <span>
                    {m.tipo} · {m.periodo_inicio} → {m.periodo_fim} ·{" "}
                    {Number(m.valor_meta).toLocaleString("pt-BR")}
                  </span>
                  <form
                    action={async () => {
                      "use server";
                      await desativarBiMeta(m.id);
                    }}
                  >
                    <Button type="submit" variant="ghost" size="sm">
                      Desativar
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          </div>
        )}

      </Container>
    </Section>
  );
}
