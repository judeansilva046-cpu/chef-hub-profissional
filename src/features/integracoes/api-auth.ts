import "server-only";

import { NextResponse } from "next/server";

import { requireOwner } from "@/server/auth/require-papel";
import { requireEmpresaAtual } from "@/server/auth/require-empresa";

export async function requireIntegrationsApi() {
  await requireOwner();
  const empresa = await requireEmpresaAtual();
  return empresa;
}

export function apiError(error: unknown, fallback = "Erro interno.") {
  const message = error instanceof Error ? error.message : fallback;
  const status =
    message.includes("owner") || message.includes("permissão")
      ? 403
      : message.includes("não encontrad")
        ? 404
        : 500;
  return NextResponse.json({ error: message }, { status });
}
