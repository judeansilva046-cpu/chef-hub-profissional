import { formatarData } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface EtiquetaPreviewProps {
  produto: string;
  loteNumero: string | null;
  dataValidade: string | null;
  tamanho: "50x30" | "60x40";
}

/** Pré-visualização client/server-neutra do layout impresso (proporção real do tamanho escolhido) — o mesmo payload é o que vai para a fila de impressão. */
export function EtiquetaPreview({ produto, loteNumero, dataValidade, tamanho }: EtiquetaPreviewProps) {
  const largura = tamanho === "50x30" ? "50mm" : "60mm";
  const altura = tamanho === "50x30" ? "30mm" : "40mm";

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          "border-foreground bg-background flex flex-col justify-center gap-0.5 border-2 border-dashed p-2 text-black",
        )}
        style={{ width: largura, height: altura, minWidth: largura, minHeight: altura }}
      >
        <p className="truncate text-[9px] leading-tight font-bold">{produto || "Produto"}</p>
        <p className="truncate text-[7px] leading-tight">Lote: {loteNumero ?? "—"}</p>
        <p className="truncate text-[7px] leading-tight">
          Validade: {dataValidade ? formatarData(dataValidade) : "—"}
        </p>
      </div>
      <p className="text-muted-foreground text-xs">
        Pré-visualização — {tamanho.replace("x", " × ")} mm
      </p>
    </div>
  );
}
