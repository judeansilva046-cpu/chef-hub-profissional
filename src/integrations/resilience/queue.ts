export type JobStatus = "queued" | "running" | "done" | "failed" | "dlq";

export interface IntegrationJob<T = unknown> {
  id: string;
  provider: string;
  operation: string;
  payload: T;
  attempts: number;
  status: JobStatus;
  lastError?: string;
  createdAt: number;
  updatedAt: number;
}

const jobs: IntegrationJob[] = [];
const dlq: IntegrationJob[] = [];

function uid(): string {
  return `job_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Fila in-process para processamento assíncrono (homolog/dev). */
export function enqueueJob<T>(input: {
  provider: string;
  operation: string;
  payload: T;
}): IntegrationJob<T> {
  const job: IntegrationJob<T> = {
    id: uid(),
    provider: input.provider,
    operation: input.operation,
    payload: input.payload,
    attempts: 0,
    status: "queued",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  jobs.push(job as IntegrationJob);
  return job;
}

export function listJobs(limit = 50): IntegrationJob[] {
  return jobs.slice(-limit);
}

export function listDlq(limit = 50): IntegrationJob[] {
  return dlq.slice(-limit);
}

export function resetQueues(): void {
  jobs.length = 0;
  dlq.length = 0;
}

export async function processNextJob(
  handler: (job: IntegrationJob) => Promise<void>,
  opts?: { maxAttempts?: number },
): Promise<IntegrationJob | null> {
  const maxAttempts = opts?.maxAttempts ?? 5;
  const job = jobs.find((j) => j.status === "queued");
  if (!job) return null;

  job.status = "running";
  job.attempts += 1;
  job.updatedAt = Date.now();

  try {
    await handler(job);
    job.status = "done";
    job.updatedAt = Date.now();
  } catch (error) {
    job.lastError = error instanceof Error ? error.message : "Erro desconhecido";
    job.updatedAt = Date.now();
    if (job.attempts >= maxAttempts) {
      job.status = "dlq";
      dlq.push({ ...job });
    } else {
      job.status = "queued";
    }
  }

  return job;
}
