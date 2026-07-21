import { Text } from "@/components/ui/text";
import type { SystemHealthReport } from "@/server/observabilidade/health";

export function SystemStatus({ report }: { report: SystemHealthReport }) {
  const critical = report.checks.filter((c) => c.status === "fail");
  const degraded = report.checks.filter((c) => c.status === "degraded");

  return (
    <div className="flex flex-col gap-2">
      <Text weight="semibold">
        Status do sistema:{" "}
        <Text
          as="span"
          tone={
            report.overall === "ok"
              ? "success"
              : report.overall === "degraded"
                ? "warning"
                : "danger"
          }
        >
          {report.overall}
        </Text>
      </Text>
      <Text tone="muted" size="sm">
        {critical.length} falha(s) · {degraded.length} degradado(s) ·{" "}
        {report.checks.length} checks
      </Text>
      <Text tone="muted" size="sm">
        Verificado em {new Date(report.checkedAt).toLocaleString("pt-BR")}
      </Text>
    </div>
  );
}
