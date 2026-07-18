import Link from "next/link";

import { Text } from "@/components/ui/text";
import type { ResumoContasPagar } from "@/features/contas-pagar/queries";
import type { ResumoContasReceber } from "@/features/contas-receber/queries";
import { formatarMoeda } from "@/lib/format";

export interface DashboardFinanceiroIndicadoresProps {
  contasPagar: ResumoContasPagar;
  contasReceber: ResumoContasReceber;
}

export function DashboardFinanceiroIndicadores({ contasPagar, contasReceber }: DashboardFinanceiroIndicadoresProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Link href="/financeiro/contas-a-pagar" className="border-border rounded-lg border p-4 transition-colors hover:bg-muted/50">
        <Text weight="medium" className="mb-3">
          Contas a pagar
        </Text>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Text size="sm" tone="muted">
              Pendente
            </Text>
            <Text weight="semibold">{formatarMoeda(contasPagar.totalPendente)}</Text>
          </div>
          <div>
            <Text size="sm" tone="muted">
              Atrasado
            </Text>
            <Text weight="semibold" tone={contasPagar.totalAtrasado > 0 ? "danger" : "default"}>
              {formatarMoeda(contasPagar.totalAtrasado)}
            </Text>
          </div>
          <div>
            <Text size="sm" tone="muted">
              Pago no mês
            </Text>
            <Text weight="semibold">{formatarMoeda(contasPagar.totalPagoNoMes)}</Text>
          </div>
        </div>
      </Link>

      <Link
        href="/financeiro/contas-a-receber"
        className="border-border rounded-lg border p-4 transition-colors hover:bg-muted/50"
      >
        <Text weight="medium" className="mb-3">
          Contas a receber
        </Text>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Text size="sm" tone="muted">
              Pendente
            </Text>
            <Text weight="semibold">{formatarMoeda(contasReceber.totalPendente)}</Text>
          </div>
          <div>
            <Text size="sm" tone="muted">
              Atrasado
            </Text>
            <Text weight="semibold" tone={contasReceber.totalAtrasado > 0 ? "danger" : "default"}>
              {formatarMoeda(contasReceber.totalAtrasado)}
            </Text>
          </div>
          <div>
            <Text size="sm" tone="muted">
              Recebido no mês
            </Text>
            <Text weight="semibold">{formatarMoeda(contasReceber.totalRecebidoNoMes)}</Text>
          </div>
        </div>
      </Link>
    </div>
  );
}
