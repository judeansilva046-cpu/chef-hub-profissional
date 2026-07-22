interface Bucket {
  tokens: number;
  updatedAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  /** Tokens por segundo (média). */
  ratePerSecond?: number;
  /** Capacidade do bucket. */
  burst?: number;
}

/** Token bucket in-memory por provedor (processo). */
export function takeRateLimitToken(
  key: string,
  opts: RateLimitOptions = {},
): { allowed: boolean; retryAfterMs: number } {
  const rate = opts.ratePerSecond ?? 5;
  const burst = opts.burst ?? rate * 2;
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { tokens: burst, updatedAt: now };
    buckets.set(key, bucket);
  }

  const elapsed = (now - bucket.updatedAt) / 1000;
  bucket.tokens = Math.min(burst, bucket.tokens + elapsed * rate);
  bucket.updatedAt = now;

  if (bucket.tokens < 1) {
    const retryAfterMs = Math.ceil(((1 - bucket.tokens) / rate) * 1000);
    return { allowed: false, retryAfterMs };
  }

  bucket.tokens -= 1;
  return { allowed: true, retryAfterMs: 0 };
}

export function resetRateLimits(): void {
  buckets.clear();
}

export class RateLimitedError extends Error {
  constructor(
    public key: string,
    public retryAfterMs: number,
  ) {
    super(`Rate limit excedido para ${key}; retry em ${retryAfterMs}ms`);
    this.name = "RateLimitedError";
  }
}

export async function withRateLimit<T>(
  key: string,
  fn: () => Promise<T>,
  opts?: RateLimitOptions,
): Promise<T> {
  const result = takeRateLimitToken(key, opts);
  if (!result.allowed) throw new RateLimitedError(key, result.retryAfterMs);
  return fn();
}
