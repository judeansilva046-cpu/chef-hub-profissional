/**
 * Modo de operação das integrações:
 * - `homolog` (default): sandbox/simulação controlada com shapes reais (CI e dev)
 * - `live`: chamadas HTTP reais aos endpoints oficiais/sandbox do provedor
 * - `disabled`: bloqueia operações (mantém só inbox/logs)
 */
export type IntegracoesMode = "homolog" | "live" | "disabled";

export function getIntegracoesMode(): IntegracoesMode {
  const raw = (process.env.INTEGRACOES_MODE ?? "homolog").toLowerCase();
  if (raw === "live" || raw === "disabled" || raw === "homolog") return raw;
  return "homolog";
}

export function isHomologMode(): boolean {
  return getIntegracoesMode() === "homolog";
}

export function isLiveMode(): boolean {
  return getIntegracoesMode() === "live";
}

export function requireCredentials(
  ctx: { credentials: Record<string, string> },
  keys: string[],
): boolean {
  return keys.every((k) => Boolean(ctx.credentials[k]?.trim()));
}

/** Base URL helper — live usa sandbox/oficial; homolog ignora. */
export function providerBaseUrl(
  envKey: string,
  fallback: string,
): string {
  return process.env[envKey]?.replace(/\/$/, "") || fallback;
}
