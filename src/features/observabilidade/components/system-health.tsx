import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import type { SystemHealthReport } from "@/server/observabilidade/health";

const STATUS_TONE: Record<
  SystemHealthReport["overall"],
  "success" | "warning" | "danger"
> = {
  ok: "success",
  degraded: "warning",
  fail: "danger",
};

export function SystemHealth({ report }: { report: SystemHealthReport }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline gap-3">
        <Text weight="semibold">
          Saúde:{" "}
          <Text as="span" tone={STATUS_TONE[report.overall]} weight="semibold">
            {report.overall.toUpperCase()}
          </Text>
        </Text>
        <Text tone="muted" size="sm">
          v{report.version} · build {report.build} · {report.environment}
        </Text>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {report.checks.map((check) => (
          <li
            key={check.name}
            className={cn(
              "border-border flex items-start justify-between gap-2 border-b py-2 last:border-0",
            )}
          >
            <div>
              <Text size="sm" weight="medium">
                {check.name}
              </Text>
              {check.detail ? (
                <Text tone="muted" size="sm">
                  {check.detail}
                </Text>
              ) : null}
            </div>
            <Text
              size="sm"
              tone={
                check.status === "ok"
                  ? "success"
                  : check.status === "degraded"
                    ? "warning"
                    : "danger"
              }
            >
              {check.status}
              {check.latencyMs != null ? ` · ${check.latencyMs}ms` : ""}
            </Text>
          </li>
        ))}
      </ul>
    </div>
  );
}
