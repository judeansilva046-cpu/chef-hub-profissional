import { Text } from "@/components/ui/text";
import { formatarDataHora } from "@/lib/format";

import { rotuloAcao, rotuloEntidade } from "../timeline";
import type { AuditEventRow } from "../queries";

export function AuditTable({ rows }: { rows: AuditEventRow[] }) {
  if (rows.length === 0) {
    return (
      <Text tone="muted" size="sm">
        Sem registros de auditoria.
      </Text>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-border text-muted-foreground border-b">
            <th className="py-2 pr-3 font-medium">Quando</th>
            <th className="py-2 pr-3 font-medium">Ação</th>
            <th className="py-2 pr-3 font-medium">Entidade</th>
            <th className="py-2 pr-3 font-medium">Papel</th>
            <th className="py-2 pr-3 font-medium">Registro</th>
            <th className="py-2 font-medium">IP</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-border border-b last:border-0">
              <td className="py-2 pr-3 whitespace-nowrap">
                {formatarDataHora(row.criado_em)}
              </td>
              <td className="py-2 pr-3">{rotuloAcao(row.acao)}</td>
              <td className="py-2 pr-3">{rotuloEntidade(row.entidade)}</td>
              <td className="py-2 pr-3">{row.papel ?? "—"}</td>
              <td className="py-2 pr-3 font-mono text-xs">
                {row.registro_id?.slice(0, 8) ?? "—"}
              </td>
              <td className="py-2 font-mono text-xs">{row.ip ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
