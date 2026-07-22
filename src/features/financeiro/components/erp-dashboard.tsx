import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { MetricCard } from "@/features/dashboard/components/metric-card";
import { formatarMoeda, formatarPercentual } from "@/lib/format";

import type { carregarDashboardErp } from "../erp/queries";

type Dash = Awaited<ReturnType<typeof carregarDashboardErp>>;

export function ErpDashboard({ data }: { data: Dash }) {
  const { kpis, dre, fluxo, alertas, contasPagar, contasReceber } = data;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Faturamento" value={formatarMoeda(kpis.faturamento)} />
        <MetricCard
          label="CMV"
          value={formatarMoeda(kpis.cmv)}
          hint={
            kpis.cmvPct != null ? formatarPercentual(kpis.cmvPct) : undefined
          }
          tone={kpis.cmvPct != null && kpis.cmvPct > 40 ? "warning" : "default"}
        />
        <MetricCard
          label="Margem"
          value={
            kpis.margemPct != null ? formatarPercentual(kpis.margemPct) : "—"
          }
          tone={
            kpis.margemPct != null && kpis.margemPct < 20 ? "warning" : "success"
          }
        />
        <MetricCard label="Lucro líquido" value={formatarMoeda(kpis.lucro)} />
        <MetricCard label="EBITDA" value={formatarMoeda(kpis.ebitda)} />
        <MetricCard label="Ticket médio" value={formatarMoeda(kpis.ticketMedio)} />
        <MetricCard
          label="Saldo caixa"
          value={formatarMoeda(kpis.saldoCaixa)}
          tone={kpis.saldoCaixa < 0 ? "danger" : "default"}
        />
        <MetricCard
          label="Saldo projetado"
          value={formatarMoeda(fluxo.projetado)}
          tone={fluxo.projetado < 0 ? "warning" : "default"}
        />
        <MetricCard
          label="A pagar"
          value={formatarMoeda(kpis.aPagarTotal)}
          hint={`${kpis.apVencidas} vencida(s) · ${kpis.apVencendo} em 7 dias`}
          tone={kpis.apVencidas > 0 ? "danger" : "default"}
        />
        <MetricCard
          label="A receber"
          value={formatarMoeda(kpis.aReceberTotal)}
        />
        <MetricCard
          label="Fluxo (entradas)"
          value={formatarMoeda(fluxo.entradas)}
        />
        <MetricCard
          label="Fluxo (saídas)"
          value={formatarMoeda(fluxo.saidas)}
          tone={fluxo.saldo < 0 ? "warning" : "default"}
        />
      </div>

      {alertas.length > 0 ? (
        <section className="flex flex-col gap-2">
          <Heading level={4}>Alertas financeiros</Heading>
          <ul className="flex flex-col gap-2">
            {alertas.map((a) => (
              <li key={`${a.tipo}-${a.mensagem}`}>
                <Text
                  size="sm"
                  tone={
                    a.severidade === "critical" || a.severidade === "error"
                      ? "danger"
                      : "warning"
                  }
                >
                  {a.mensagem}
                </Text>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-2">
          <Heading level={4}>DRE (resumo)</Heading>
          <Dl
            rows={[
              ["Receita bruta", dre.receitaBruta],
              ["(-) Impostos", dre.impostos],
              ["Receita líquida", dre.receitaLiquida],
              ["(-) CMV", dre.cmv],
              ["Lucro bruto", dre.lucroBruto],
              ["(-) Despesas operacionais", dre.despesasOperacionais],
              ["(-) Folha", dre.folha],
              ["(-) Marketing", dre.marketing],
              ["(-) Aluguel", dre.aluguel],
              ["EBITDA", dre.ebitda],
              ["Lucro operacional", dre.lucroOperacional],
              ["Lucro líquido", dre.lucroLiquido],
            ]}
          />
        </section>

        <section className="flex flex-col gap-3">
          <Heading level={4}>Contas recentes</Heading>
          <Text weight="medium" size="sm">
            A pagar
          </Text>
          <TitulosList
            rows={contasPagar.map((c) => ({
              id: c.id,
              desc: c.description,
              due: c.due_date,
              amount: Number(c.amount) - Number(c.paid_amount),
              status: c.status,
            }))}
          />
          <Text weight="medium" size="sm" className="mt-2">
            A receber
          </Text>
          <TitulosList
            rows={contasReceber.map((c) => ({
              id: c.id,
              desc: c.description,
              due: c.due_date,
              amount: Number(c.amount) - Number(c.received_amount),
              status: c.status,
            }))}
          />
        </section>
      </div>
    </div>
  );
}

function Dl({ rows }: { rows: Array<[string, number]> }) {
  return (
    <dl className="flex flex-col gap-1.5 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-4 border-b border-border py-1.5">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="font-medium">{formatarMoeda(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function TitulosList({
  rows,
}: {
  rows: Array<{
    id: string;
    desc: string;
    due: string;
    amount: number;
    status: string;
  }>;
}) {
  if (rows.length === 0) {
    return (
      <Text tone="muted" size="sm">
        Nenhum título.
      </Text>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {rows.slice(0, 8).map((r) => (
        <li key={r.id} className="flex justify-between gap-2 text-sm">
          <span className="min-w-0 truncate">
            {r.desc}{" "}
            <span className="text-muted-foreground">· {r.due}</span>
          </span>
          <span className="shrink-0 font-medium">
            {formatarMoeda(r.amount)} · {r.status}
          </span>
        </li>
      ))}
    </ul>
  );
}
