export type CircuitState = "closed" | "open" | "half_open";

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  cooldownMs?: number;
  successThreshold?: number;
}

interface CircuitInternal {
  state: CircuitState;
  failures: number;
  successes: number;
  openedAt: number | null;
}

const circuits = new Map<string, CircuitInternal>();

export class CircuitOpenError extends Error {
  constructor(public key: string) {
    super(`Circuit breaker aberto para ${key}`);
    this.name = "CircuitOpenError";
  }
}

function getCircuit(key: string): CircuitInternal {
  let c = circuits.get(key);
  if (!c) {
    c = { state: "closed", failures: 0, successes: 0, openedAt: null };
    circuits.set(key, c);
  }
  return c;
}

/** Para testes. */
export function resetCircuitBreakers(): void {
  circuits.clear();
}

export function getCircuitState(key: string): CircuitState {
  return getCircuit(key).state;
}

export async function withCircuitBreaker<T>(
  key: string,
  fn: () => Promise<T>,
  opts: CircuitBreakerOptions = {},
): Promise<T> {
  const failureThreshold = opts.failureThreshold ?? 5;
  const cooldownMs = opts.cooldownMs ?? 30_000;
  const successThreshold = opts.successThreshold ?? 2;
  const circuit = getCircuit(key);
  const now = Date.now();

  if (circuit.state === "open") {
    if (circuit.openedAt != null && now - circuit.openedAt >= cooldownMs) {
      circuit.state = "half_open";
      circuit.successes = 0;
    } else {
      throw new CircuitOpenError(key);
    }
  }

  try {
    const result = await fn();
    if (circuit.state === "half_open") {
      circuit.successes += 1;
      if (circuit.successes >= successThreshold) {
        circuit.state = "closed";
        circuit.failures = 0;
        circuit.openedAt = null;
      }
    } else {
      circuit.failures = 0;
    }
    return result;
  } catch (error) {
    circuit.failures += 1;
    circuit.successes = 0;
    if (circuit.failures >= failureThreshold || circuit.state === "half_open") {
      circuit.state = "open";
      circuit.openedAt = now;
    }
    throw error;
  }
}
