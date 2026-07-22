import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { KdsBoard } from "@/features/kds/components/kds-board";
import {
  listarEventosKds,
  listarPedidosParaKds,
  listarPracasProducao,
  obterConfigKds,
  obterMetricasKds,
} from "@/features/kds/queries";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

export const metadata: Metadata = {
  title: "KDS — Chef Hub Profissional",
};

export default async function KdsPage() {
  const empresa = await getEmpresaAtual();
  if (!empresa) redirect("/onboarding");

  const [pedidos, pracas, config, eventos, metricas] = await Promise.all([
    listarPedidosParaKds(),
    listarPracasProducao(),
    obterConfigKds(),
    listarEventosKds(),
    obterMetricasKds(),
  ]);

  return (
    <KdsBoard
      pedidos={pedidos}
      pracas={pracas}
      empresaId={empresa.id}
      config={config}
      eventos={eventos}
      metricas={metricas}
    />
  );
}
