import { MetricCard } from "@/features/dashboard/components/metric-card";
import { formatarMoeda, formatarPercentual } from "@/lib/format";
import type { ObservabilityMetrics } from "@/server/observabilidade/metrics";

export function MetricsDashboard({ metrics }: { metrics: ObservabilityMetrics }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="Erros (hoje)"
        value={String(metrics.erros)}
        tone={metrics.erros > 0 ? "danger" : "default"}
      />
      <MetricCard
        label="Alertas abertos"
        value={String(metrics.alertasAbertos)}
        tone={metrics.alertasAbertos > 0 ? "warning" : "default"}
      />
      <MetricCard
        label="Usuários ativos"
        value={String(metrics.usuariosAtivos)}
      />
      <MetricCard
        label="Sessões (membros)"
        value={String(metrics.sessoesAbertas)}
      />
      <MetricCard
        label="Tempo médio resposta"
        value={
          metrics.tempoMedioRespostaMs != null
            ? `${metrics.tempoMedioRespostaMs} ms`
            : "—"
        }
      />
      <MetricCard
        label="Consultas / RPC / Rotas lentas"
        value={`${metrics.consultasLentas} / ${metrics.rpcsLentas} / ${metrics.rotasLentas}`}
      />
      <MetricCard
        label="Memória (RSS)"
        value={
          metrics.usoMemoriaMb != null ? `${metrics.usoMemoriaMb} MB` : "—"
        }
      />
      <MetricCard label="Uso de banco" value={metrics.usoBancoAprox} hint="Supabase" />
      <MetricCard label="Receita (mês)" value={formatarMoeda(metrics.receita)} />
      <MetricCard label="CMV (mês)" value={formatarMoeda(metrics.cmv)} />
      <MetricCard
        label="Margem"
        value={formatarPercentual(metrics.margemPct)}
        tone={metrics.margemPct < 20 ? "warning" : "success"}
      />
      <MetricCard
        label="Lucro estimado"
        value={formatarMoeda(metrics.lucroEstimado)}
      />
      <MetricCard
        label="Ticket médio"
        value={formatarMoeda(metrics.ticketMedio)}
      />
      <MetricCard
        label="Tempo médio pedido"
        value={
          metrics.tempoMedioPedidoMin != null
            ? `${metrics.tempoMedioPedidoMin} min`
            : "—"
        }
      />
      <MetricCard
        label="Tempo cozinha"
        value={
          metrics.tempoCozinhaMin != null
            ? `${metrics.tempoCozinhaMin} min`
            : "—"
        }
      />
      <MetricCard
        label="Tempo atendimento"
        value={
          metrics.tempoAtendimentoMin != null
            ? `${metrics.tempoAtendimentoMin} min`
            : "—"
        }
      />
    </div>
  );
}
