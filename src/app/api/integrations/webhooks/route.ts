import { type NextRequest, NextResponse } from "next/server";

import { processWebhookInbox } from "@/features/integracoes/webhook-inbox";

export async function POST(request: NextRequest) {
  const provider =
    request.nextUrl.searchParams.get("provider") ??
    request.headers.get("x-integration-provider") ??
    "";

  const rawBody = await request.text();
  const result = await processWebhookInbox({
    provider,
    rawBody,
    headers: request.headers,
  });

  return NextResponse.json(result.body, { status: result.status });
}
