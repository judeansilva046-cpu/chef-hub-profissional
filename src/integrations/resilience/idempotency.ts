import { createHash, createHmac } from "node:crypto";

const seen = new Map<string, { expiresAt: number; result: unknown }>();

export function idempotencyKey(
  provider: string,
  operation: string,
  payload: unknown,
): string {
  const raw = JSON.stringify({ provider, operation, payload });
  return createHash("sha256").update(raw).digest("hex");
}

/** Cache curto in-memory para evitar reprocessar o mesmo evento. */
export function rememberIdempotent<T>(
  key: string,
  ttlMs: number,
  compute: () => T,
): T {
  const now = Date.now();
  const hit = seen.get(key);
  if (hit && hit.expiresAt > now) return hit.result as T;

  const result = compute();
  seen.set(key, { expiresAt: now + ttlMs, result });
  return result;
}

export async function rememberIdempotentAsync<T>(
  key: string,
  ttlMs: number,
  compute: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const hit = seen.get(key);
  if (hit && hit.expiresAt > now) return hit.result as T;

  const result = await compute();
  seen.set(key, { expiresAt: now + ttlMs, result });
  return result;
}

export function resetIdempotencyCache(): void {
  seen.clear();
}

/** HMAC-SHA256 hex para assinatura de webhooks. */
export function hmacSha256Hex(secret: string, rawBody: string): string {
  return createHmac("sha256", secret).update(rawBody).digest("hex");
}

export function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}
