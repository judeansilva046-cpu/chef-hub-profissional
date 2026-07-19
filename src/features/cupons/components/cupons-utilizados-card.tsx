import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";
import { formatarData, formatarMoeda } from "@/lib/format";

/** empresa_id filtrado explicitamente além de cliente_id — defesa em profundidade, RLS já isola por empresa. */
async function listarUsosCupomPorCliente(clienteId: string) {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_cupons_usos")
    .select("id, valor_desconto, criado_em, crm_cupons(codigo)")
    .eq("cliente_id", clienteId)
    .eq("empresa_id", empresa.id)
    .order("criado_em", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as unknown as Array<{
    id: string;
    valor_desconto: number;
    criado_em: string;
    crm_cupons: { codigo: string } | null;
  }>).map((linha) => ({
    id: linha.id,
    codigo: linha.crm_cupons?.codigo ?? "—",
    valorDesconto: linha.valor_desconto,
    criadoEm: linha.criado_em,
  }));
}

export async function CuponsUtilizadosCard({ clienteId }: { clienteId: string }) {
  const usos = await listarUsosCupomPorCliente(clienteId);

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Cupons utilizados</CardTitle>
      </CardHeader>
      <CardContent>
        {usos.length === 0 ? (
          <EmptyState title="Nenhum cupom utilizado" description="Os cupons usados por este cliente aparecerão aqui." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cupom</TableHead>
                <TableHead className="text-right">Desconto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usos.map((uso) => (
                <TableRow key={uso.id}>
                  <TableCell className="text-muted-foreground">{formatarData(uso.criadoEm)}</TableCell>
                  <TableCell className="text-foreground font-medium">{uso.codigo}</TableCell>
                  <TableCell className="text-right">{formatarMoeda(uso.valorDesconto)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
