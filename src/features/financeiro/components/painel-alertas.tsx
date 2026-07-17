import Link from "next/link";
import {
  AlertTriangle,
  ClipboardList,
  PackageX,
  ShoppingCart,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { formatarMoeda, formatarPercentual } from "@/lib/format";

export interface FichaAlerta {
  id: string;
  nome: string;
  margemPercentual: number;
  margemUnitaria: number;
}

export interface PainelAlertasProps {
  fichasNoVermelho: FichaAlerta[];
  fichasAbaixoDoNecessario: FichaAlerta[];
  ingredientesAbaixoDoMinimo: number;
  lotesVencendoEm7Dias: number;
  pedidosCompraPendentes: number;
  producoesNaoConcluidasNaSemana: number;
}

export function PainelAlertas({
  fichasNoVermelho,
  fichasAbaixoDoNecessario,
  ingredientesAbaixoDoMinimo,
  lotesVencendoEm7Dias,
  pedidosCompraPendentes,
  producoesNaoConcluidasNaSemana,
}: PainelAlertasProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fichas técnicas em alerta</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {fichasNoVermelho.length === 0 && fichasAbaixoDoNecessario.length === 0 ? (
            <Text tone="muted" size="sm">
              Nenhuma ficha técnica com margem abaixo do necessário.
            </Text>
          ) : (
            <>
              {fichasNoVermelho.map((ficha) => (
                <div key={ficha.id} className="flex items-center justify-between gap-2">
                  <Link
                    href={`/fichas-tecnicas/${ficha.id}`}
                    className="text-foreground text-sm font-medium hover:underline"
                  >
                    {ficha.nome}
                  </Link>
                  <Badge variant="danger">
                    {formatarMoeda(ficha.margemUnitaria)} ({formatarPercentual(ficha.margemPercentual)})
                  </Badge>
                </div>
              ))}
              {fichasAbaixoDoNecessario.map((ficha) => (
                <div key={ficha.id} className="flex items-center justify-between gap-2">
                  <Link
                    href={`/fichas-tecnicas/${ficha.id}`}
                    className="text-foreground text-sm font-medium hover:underline"
                  >
                    {ficha.nome}
                  </Link>
                  <Badge variant="warning">
                    {formatarPercentual(ficha.margemPercentual)}
                  </Badge>
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Outros módulos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Link
            href="/estoque"
            className="hover:bg-secondary flex items-center justify-between gap-2 rounded-md px-2 py-1.5 -mx-2 transition-colors"
          >
            <span className="flex items-center gap-2 text-sm">
              <PackageX className="text-muted-foreground h-4 w-4" />
              Ingredientes abaixo do estoque mínimo
            </span>
            <Badge variant={ingredientesAbaixoDoMinimo > 0 ? "danger" : "success"}>
              {ingredientesAbaixoDoMinimo}
            </Badge>
          </Link>

          <Link
            href="/estoque/lotes"
            className="hover:bg-secondary flex items-center justify-between gap-2 rounded-md px-2 py-1.5 -mx-2 transition-colors"
          >
            <span className="flex items-center gap-2 text-sm">
              <AlertTriangle className="text-muted-foreground h-4 w-4" />
              Lotes vencendo em 7 dias
            </span>
            <Badge variant={lotesVencendoEm7Dias > 0 ? "warning" : "success"}>
              {lotesVencendoEm7Dias}
            </Badge>
          </Link>

          <Link
            href="/compras/pedidos"
            className="hover:bg-secondary flex items-center justify-between gap-2 rounded-md px-2 py-1.5 -mx-2 transition-colors"
          >
            <span className="flex items-center gap-2 text-sm">
              <ShoppingCart className="text-muted-foreground h-4 w-4" />
              Pedidos de compra pendentes de recebimento
            </span>
            <Badge variant={pedidosCompraPendentes > 0 ? "info" : "success"}>
              {pedidosCompraPendentes}
            </Badge>
          </Link>

          <Link
            href="/producao"
            className="hover:bg-secondary flex items-center justify-between gap-2 rounded-md px-2 py-1.5 -mx-2 transition-colors"
          >
            <span className="flex items-center gap-2 text-sm">
              <ClipboardList className="text-muted-foreground h-4 w-4" />
              Produções não concluídas nesta semana
            </span>
            <Badge variant={producoesNaoConcluidasNaSemana > 0 ? "info" : "success"}>
              {producoesNaoConcluidasNaSemana}
            </Badge>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
