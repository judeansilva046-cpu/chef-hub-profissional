export {
  CircuitOpenError,
  getCircuitState,
  resetCircuitBreakers,
  withCircuitBreaker,
} from "./circuit-breaker";
export {
  hmacSha256Hex,
  idempotencyKey,
  rememberIdempotent,
  rememberIdempotentAsync,
  resetIdempotencyCache,
  timingSafeEqualHex,
} from "./idempotency";
export {
  enqueueJob,
  listDlq,
  listJobs,
  processNextJob,
  resetQueues,
  type IntegrationJob,
} from "./queue";
export {
  RateLimitedError,
  resetRateLimits,
  takeRateLimitToken,
  withRateLimit,
} from "./rate-limit";
export { defaultShouldRetry, withRetry } from "./retry";

import { withCircuitBreaker } from "./circuit-breaker";
import { withRateLimit } from "./rate-limit";
import { withRetry } from "./retry";

/** Combina rate limit + circuit breaker + retry para uma chamada externa. */
export async function callExternal<T>(
  providerKey: string,
  fn: () => Promise<T>,
): Promise<T> {
  return withRateLimit(providerKey, () =>
    withCircuitBreaker(providerKey, () => withRetry(() => fn())),
  );
}
