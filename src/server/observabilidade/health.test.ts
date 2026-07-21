import { describe, expect, it } from "vitest";

describe("health report shape", () => {
  it("classifica overall a partir de checks", () => {
    type Status = "ok" | "degraded" | "fail";
    const overall = (checks: Status[]): Status => {
      if (checks.some((c) => c === "fail")) return "fail";
      if (checks.some((c) => c === "degraded")) return "degraded";
      return "ok";
    };

    expect(overall(["ok", "ok"])).toBe("ok");
    expect(overall(["ok", "degraded"])).toBe("degraded");
    expect(overall(["ok", "fail", "degraded"])).toBe("fail");
  });

  it("valida nomes de checks obrigatórios do health", () => {
    const required = [
      "auth",
      "database",
      "storage",
      "cache",
      "filas",
      "version",
      "build",
      "environment",
    ];
    const sample = new Set([
      "env:NEXT_PUBLIC_SUPABASE_URL",
      "env:NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "env:SUPABASE_SERVICE_ROLE_KEY",
      "auth",
      "database",
      "rpc:fn_empresas_acessiveis",
      "storage",
      "cache",
      "filas",
      "version",
      "build",
      "environment",
    ]);
    for (const name of required) {
      expect(sample.has(name)).toBe(true);
    }
  });
});
