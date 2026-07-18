import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import type { Tables } from "@/lib/supabase/database.types";

const formatoMoeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const formatoPercentual = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
});
const formatoData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

interface SnapshotFichaTecnica {
  custo_total?: number;
  custo_por_porcao?: number;
  cmv_percentual?: number | null;
  margem_contribuicao_percentual?: number | null;
  markup_percentual?: number | null;
  itens?: unknown[];
}

export interface VersoesTimelineProps {
  versoes: Tables<"fichas_tecnicas_versoes">[];
}

export function VersoesTimeline({ versoes }: VersoesTimelineProps) {
  if (versoes.length === 0) {
    return (
      <EmptyState
        title="Nenhuma versão registrada"
        description="Toda vez que a ficha técnica é salva, uma nova versão é gerada automaticamente."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {versoes.map((versao) => {
        const snapshot = versao.snapshot as SnapshotFichaTecnica;

        return (
          <Card key={versao.id}>
            <CardContent className="flex flex-col gap-3 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Text weight="semibold">Versão {versao.numero_versao}</Text>
                <Text size="sm" tone="muted">
                  {formatoData.format(new Date(versao.criado_em))}
                </Text>
              </div>

              {versao.motivo && (
                <Text size="sm" tone="muted">
                  {versao.motivo}
                </Text>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <Metrica
                  label="Custo total"
                  valor={
                    snapshot.custo_total !== undefined
                      ? formatoMoeda.format(snapshot.custo_total)
                      : "—"
                  }
                />
                <Metrica
                  label="Custo/porção"
                  valor={
                    snapshot.custo_por_porcao !== undefined
                      ? formatoMoeda.format(snapshot.custo_por_porcao)
                      : "—"
                  }
                />
                <Metrica
                  label="CMV %"
                  valor={
                    snapshot.cmv_percentual != null
                      ? `${formatoPercentual.format(snapshot.cmv_percentual)}%`
                      : "—"
                  }
                />
                <Metrica
                  label="Margem"
                  valor={
                    snapshot.margem_contribuicao_percentual != null
                      ? `${formatoPercentual.format(snapshot.margem_contribuicao_percentual)}%`
                      : "—"
                  }
                />
                <Metrica
                  label="Ingredientes"
                  valor={String(snapshot.itens?.length ?? "—")}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function Metrica({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex flex-col">
      <Text size="sm" tone="muted">
        {label}
      </Text>
      <Text weight="medium">{valor}</Text>
    </div>
  );
}
