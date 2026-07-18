import { Text } from "@/components/ui/text";
import { formatarMoeda, formatarPercentual } from "@/lib/format";

import type { DemonstrativoResultado } from "../calculations";

export interface DreDemonstrativoProps {
  dre: DemonstrativoResultado;
}

function Linha({
  label,
  valor,
  destaque,
  indentado,
  negativo,
}: {
  label: string;
  valor: number;
  destaque?: boolean;
  indentado?: boolean;
  negativo?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between py-2 ${destaque ? "border-border border-t" : ""}`}>
      <Text weight={destaque ? "semibold" : "normal"} className={indentado ? "pl-4" : ""} tone={indentado ? "muted" : "default"}>
        {label}
      </Text>
      <Text weight={destaque ? "semibold" : "normal"} tone={negativo ? "danger" : "default"}>
        {negativo && valor > 0 ? "− " : ""}
        {formatarMoeda(valor)}
      </Text>
    </div>
  );
}

export function DreDemonstrativo({ dre }: DreDemonstrativoProps) {
  return (
    <div className="border-border max-w-2xl rounded-lg border p-6">
      <Linha label="Receita bruta de vendas" valor={dre.receitaBruta} />
      <Linha label="(−) CMV" valor={dre.cmv} negativo />
      <Linha label="= Lucro bruto" valor={dre.lucroBruto} destaque />
      <Text size="sm" tone="muted" className="pb-2">
        Margem bruta: {dre.margemBrutaPercentual !== null ? formatarPercentual(dre.margemBrutaPercentual) : "—"}
      </Text>

      {dre.despesasPorCategoria.map((despesa) => (
        <Linha key={despesa.categoria} label={despesa.categoria} valor={despesa.valor} indentado negativo />
      ))}
      <Linha label="(−) Despesas operacionais" valor={dre.despesasOperacionais} negativo />
      <Linha label="= Lucro líquido" valor={dre.lucroLiquido} destaque />
      <Text size="sm" tone="muted">
        Margem líquida: {dre.margemLiquidaPercentual !== null ? formatarPercentual(dre.margemLiquidaPercentual) : "—"}
      </Text>
    </div>
  );
}
