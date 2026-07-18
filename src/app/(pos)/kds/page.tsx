import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { KdsBoard } from "@/features/kds/components/kds-board";
import { listarPedidosParaKds, listarPracasProducao } from "@/features/kds/queries";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

export const metadata: Metadata = {
  title: "KDS — Chef Hub Profissional",
};

export default async function KdsPage() {
  const empresa = await getEmpresaAtual();
  if (!empresa) redirect("/onboarding");

  const [pedidos, pracas] = await Promise.all([listarPedidosParaKds(), listarPracasProducao()]);

  return <KdsBoard pedidos={pedidos} pracas={pracas} empresaId={empresa.id} />;
}
