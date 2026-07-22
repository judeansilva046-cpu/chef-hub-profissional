import { type NextRequest, NextResponse } from "next/server";

import {
  acumularPontosVenda,
  atualizarContagemSegmentos,
  criarCampanha,
  criarCupom,
  dispararCampanha,
  resgatarCupom,
  resgatarPontos,
  salvarPerfilCliente,
  salvarProgramaFidelidade,
} from "@/features/crm/actions";
import {
  carregarDashboardCrm,
  listarCampanhas,
  listarCupons,
  listarSegmentosComContagem,
  obterProgramaFidelidade,
  saldoCashbackCliente,
  saldoPontosCliente,
} from "@/features/crm/queries";
import { requirePapel } from "@/server/auth/require-papel";
import { comMedicao } from "@/server/observabilidade/logs";

type Params = { params: Promise<{ tipo: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await requirePapel("financeiro", "caixa", "garcom");
    const { tipo } = await params;
    const { searchParams } = new URL(request.url);
    const clienteId = searchParams.get("clienteId");

    const payload = await comMedicao(`GET /api/crm/${tipo}`, "rota", async () => {
      switch (tipo) {
        case "clientes":
        case "relatorios":
        case "analytics":
          return carregarDashboardCrm();
        case "fidelidade":
          return { programa: await obterProgramaFidelidade() };
        case "cashback":
          if (!clienteId) return { error: "clienteId obrigatório" };
          return { saldo: await saldoCashbackCliente(clienteId) };
        case "pontos":
          if (!clienteId) return { error: "clienteId obrigatório" };
          return { saldo: await saldoPontosCliente(clienteId) };
        case "cupons":
          return { items: await listarCupons() };
        case "segmentacao":
        case "segmentos":
          return { items: await listarSegmentosComContagem() };
        case "campanhas":
          return { items: await listarCampanhas() };
        case "comunicacao":
          return {
            canais: ["whatsapp", "email", "sms", "push"],
            nota: "Envio via Central de Integrações (stubs até Sprint 18).",
          };
        default:
          throw new Error("Tipo inválido.");
      }
    });

    if (payload && typeof payload === "object" && "error" in payload) {
      return NextResponse.json(payload, { status: 400 });
    }
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno.";
    const status = message.includes("permissão") || message.includes("papel") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    await requirePapel("caixa", "garcom");
    const { tipo } = await params;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    const result = await comMedicao(`POST /api/crm/${tipo}`, "rota", async () => {
      switch (tipo) {
        case "clientes":
          await salvarPerfilCliente(body);
          return { ok: true };
        case "fidelidade":
          if (body.acao === "resgatar") return resgatarPontos(body);
          if (body.acao === "acumular") return acumularPontosVenda(body as never);
          await salvarProgramaFidelidade(body);
          return { ok: true };
        case "cashback":
          return acumularPontosVenda(body as never);
        case "cupons":
          if (body.acao === "resgatar") return resgatarCupom(body);
          return { id: await criarCupom(body) };
        case "segmentacao":
        case "segmentos":
          return { total: await atualizarContagemSegmentos() };
        case "campanhas":
          if (body.acao === "disparar" && typeof body.id === "string") {
            return dispararCampanha(body.id);
          }
          return { id: await criarCampanha(body) };
        case "comunicacao":
          if (typeof body.campaignId === "string") {
            return dispararCampanha(body.campaignId);
          }
          throw new Error("Informe campaignId para comunicação.");
        case "relatorios":
          return carregarDashboardCrm();
        default:
          throw new Error("Tipo POST inválido.");
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno.";
    const status = message.includes("inválid") || message.includes("Cupom") || message.includes("Saldo")
      ? 400
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
