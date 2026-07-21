import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

export type HealthCheckItem = {
  name: string;
  status: "ok" | "degraded" | "fail";
  detail?: string;
  latencyMs?: number;
};

export type SystemHealthReport = {
  overall: "ok" | "degraded" | "fail";
  checkedAt: string;
  version: string;
  build: string;
  environment: string;
  empresaId: string | null;
  checks: HealthCheckItem[];
};

function envStatus(name: string): HealthCheckItem {
  const value = process.env[name];
  return {
    name: `env:${name}`,
    status: value ? "ok" : "fail",
    detail: value ? "definida" : "ausente",
  };
}

export async function runSystemHealthCheck(): Promise<SystemHealthReport> {
  const checks: HealthCheckItem[] = [];
  const version = process.env.npm_package_version ?? "0.1.0";
  const build =
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
    process.env.NEXT_PUBLIC_BUILD_ID ??
    "local";
  const environment = process.env.NODE_ENV ?? "development";

  checks.push(envStatus("NEXT_PUBLIC_SUPABASE_URL"));
  checks.push(envStatus("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"));
  const hasService = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  checks.push({
    name: "env:SUPABASE_SERVICE_ROLE_KEY",
    status: hasService ? "ok" : "degraded",
    detail: hasService
      ? "definida"
      : "ausente (ok em local sem admin scripts)",
  });

  let empresaId: string | null = null;
  try {
    const empresa = await getEmpresaAtual();
    empresaId = empresa?.id ?? null;
  } catch {
    empresaId = null;
  }

  try {
    const t0 = Date.now();
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    checks.push({
      name: "auth",
      status: error ? "fail" : data.user ? "ok" : "degraded",
      detail:
        error?.message ??
        (data.user ? `user:${data.user.id.slice(0, 8)}` : "sem sessão"),
      latencyMs: Date.now() - t0,
    });
  } catch (e) {
    checks.push({
      name: "auth",
      status: "fail",
      detail: e instanceof Error ? e.message : "erro auth",
    });
  }

  try {
    const t0 = Date.now();
    const supabase = await createClient();
    const { error } = await supabase.from("empresas").select("id").limit(1);
    checks.push({
      name: "database",
      status: error ? "fail" : "ok",
      detail: error?.message ?? "select empresas ok",
      latencyMs: Date.now() - t0,
    });
  } catch (e) {
    checks.push({
      name: "database",
      status: "fail",
      detail: e instanceof Error ? e.message : "erro db",
    });
  }

  try {
    const t0 = Date.now();
    const supabase = await createClient();
    const { error } = await supabase.rpc("fn_empresas_acessiveis");
    checks.push({
      name: "rpc:fn_empresas_acessiveis",
      status: error ? "fail" : "ok",
      detail: error?.message ?? "rpc ok",
      latencyMs: Date.now() - t0,
    });
  } catch (e) {
    checks.push({
      name: "rpc",
      status: "degraded",
      detail: e instanceof Error ? e.message : "rpc indisponível",
    });
  }

  try {
    const t0 = Date.now();
    const supabase = await createClient();
    const { error } = await supabase.storage.listBuckets();
    checks.push({
      name: "storage",
      status: error ? "degraded" : "ok",
      detail: error?.message ?? "listBuckets ok",
      latencyMs: Date.now() - t0,
    });
  } catch (e) {
    checks.push({
      name: "storage",
      status: "degraded",
      detail: e instanceof Error ? e.message : "storage indisponível",
    });
  }

  checks.push({
    name: "cache",
    status: "ok",
    detail: "Next.js fetch cache / server runtime",
  });
  checks.push({
    name: "filas",
    status: "ok",
    detail: "sem fila externa configurada (n/a)",
  });
  checks.push({ name: "version", status: "ok", detail: version });
  checks.push({ name: "build", status: "ok", detail: build });
  checks.push({ name: "environment", status: "ok", detail: environment });

  const hasFail = checks.some((c) => c.status === "fail");
  const hasDegraded = checks.some((c) => c.status === "degraded");
  const overall = hasFail ? "fail" : hasDegraded ? "degraded" : "ok";

  return {
    overall,
    checkedAt: new Date().toISOString(),
    version,
    build,
    environment,
    empresaId,
    checks,
  };
}
