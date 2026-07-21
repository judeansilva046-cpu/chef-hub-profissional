import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { RoleDashboard } from "@/features/dashboard/components/role-dashboard";
import { carregarDashboardPorPapel } from "@/features/dashboard/queries-por-papel";
import { getPapelNaEmpresaAtual } from "@/server/auth/get-empresa-atual";
import { requireEmpresaAtual } from "@/server/auth/require-empresa";

export const metadata: Metadata = {
  title: "Dashboard — Chef Hub Profissional",
};

interface DashboardPageProps {
  searchParams: Promise<{
    dataInicio?: string;
    dataFim?: string;
  }>;
}

async function DashboardPorPapel({
  dataInicio,
  dataFim,
}: {
  dataInicio?: string;
  dataFim?: string;
}) {
  await requireEmpresaAtual();
  const papel = await getPapelNaEmpresaAtual();
  if (!papel) {
    redirect("/onboarding");
  }

  const data = await carregarDashboardPorPapel(papel, { dataInicio, dataFim });
  return <RoleDashboard data={data} />;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;

  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-4 p-8">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
        </div>
      }
    >
      <DashboardPorPapel
        dataInicio={params.dataInicio}
        dataFim={params.dataFim}
      />
    </Suspense>
  );
}
