import { type NextRequest, NextResponse } from "next/server";

import { processWebhookInbox } from "@/features/integracoes/webhook-inbox";

/** Compatibilidade Sprint 04 — mesmo inbox da Central (Sprint 13). */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provedor: string }> },
) {
  const { provedor } = await params;
  const rawBody = await request.text();
  const result = await processWebhookInbox({
    provider: provedor,
    rawBody,
    headers: request.headers,
  });
  return NextResponse.json(result.body, { status: result.status });
}
