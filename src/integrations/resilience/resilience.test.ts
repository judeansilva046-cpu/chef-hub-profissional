import { describe, expect, it, beforeEach } from "vitest";

import {
  CircuitOpenError,
  getCircuitState,
  resetCircuitBreakers,
  withCircuitBreaker,
} from "./circuit-breaker";
import {
  hmacSha256Hex,
  idempotencyKey,
  rememberIdempotent,
  resetIdempotencyCache,
  timingSafeEqualHex,
} from "./idempotency";
import {
  enqueueJob,
  listDlq,
  processNextJob,
  resetQueues,
} from "./queue";
import { resetRateLimits, takeRateLimitToken, withRateLimit, RateLimitedError } from "./rate-limit";
import { withRetry } from "./retry";

describe("resilience — retry / circuit / rate / idempotency / DLQ", () => {
  beforeEach(() => {
    resetCircuitBreakers();
    resetRateLimits();
    resetIdempotencyCache();
    resetQueues();
  });

  it("retry com sucesso após falhas", async () => {
    let n = 0;
    const result = await withRetry(
      async () => {
        n += 1;
        if (n < 3) {
          const err = new Error("fail") as Error & { status: number };
          err.status = 503;
          throw err;
        }
        return "ok";
      },
      { maxAttempts: 4, baseDelayMs: 1, maxDelayMs: 5 },
    );
    expect(result).toBe("ok");
    expect(n).toBe(3);
  });

  it("abre circuit breaker após falhas", async () => {
    const key = "test-provider";
    for (let i = 0; i < 5; i++) {
      await expect(
        withCircuitBreaker(key, async () => {
          throw new Error("boom");
        }, { failureThreshold: 5, cooldownMs: 60_000 }),
      ).rejects.toThrow("boom");
    }
    expect(getCircuitState(key)).toBe("open");
    await expect(
      withCircuitBreaker(key, async () => "x", { failureThreshold: 5, cooldownMs: 60_000 }),
    ).rejects.toBeInstanceOf(CircuitOpenError);
  });

  it("reconecta após cooldown (half-open → closed)", async () => {
    const key = "reconnect";
    for (let i = 0; i < 2; i++) {
      await expect(
        withCircuitBreaker(
          key,
          async () => {
            throw new Error("down");
          },
          { failureThreshold: 2, cooldownMs: 15, successThreshold: 1 },
        ),
      ).rejects.toThrow("down");
    }
    expect(getCircuitState(key)).toBe("open");
    await new Promise((r) => setTimeout(r, 20));
    await expect(
      withCircuitBreaker(key, async () => "ok", {
        failureThreshold: 2,
        cooldownMs: 15,
        successThreshold: 1,
      }),
    ).resolves.toBe("ok");
    expect(getCircuitState(key)).toBe("closed");
  });

  it("rate limit bloqueia burst", async () => {
    const key = "rl";
    expect(takeRateLimitToken(key, { ratePerSecond: 1, burst: 1 }).allowed).toBe(true);
    expect(takeRateLimitToken(key, { ratePerSecond: 1, burst: 1 }).allowed).toBe(false);
    await expect(
      withRateLimit(key, async () => 1, { ratePerSecond: 1, burst: 1 }),
    ).rejects.toBeInstanceOf(RateLimitedError);
  });

  it("idempotência e assinatura HMAC", () => {
    const key = idempotencyKey("ifood", "webhook", { id: 1 });
    expect(rememberIdempotent(key, 1000, () => 42)).toBe(42);
    expect(rememberIdempotent(key, 1000, () => 99)).toBe(42);
    const sig = hmacSha256Hex("secret", '{"a":1}');
    expect(timingSafeEqualHex(sig, sig)).toBe(true);
    expect(timingSafeEqualHex(sig, "00")).toBe(false);
  });

  it("fila envia para DLQ após max attempts", async () => {
    enqueueJob({ provider: "ifood", operation: "sync", payload: {} });
    for (let i = 0; i < 5; i++) {
      await processNextJob(async () => {
        throw new Error("fail");
      }, { maxAttempts: 5 });
    }
    expect(listDlq().length).toBe(1);
    expect(listDlq()[0]!.status).toBe("dlq");
  });
});
