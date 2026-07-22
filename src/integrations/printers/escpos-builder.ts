/** Gera payload ESC/POS textual (homolog + drivers térmicos). */

export type SetorImpressao = "cozinha" | "bar" | "balcao" | "caixa" | "comprovante";

export function buildEscPosJob(input: {
  type: SetorImpressao | string;
  payload: string;
  printerName?: string;
}): { jobId: string; bytesBase64: string; raw: string } {
  const jobId = `print_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const init = "\x1B@"; // ESC @
  const cut = "\x1DVA\x00"; // partial cut
  const header = [
    init,
    `\x1Ba\x01`, // center
    `ChefHub — ${input.type.toUpperCase()}\n`,
    `\x1Ba\x00`,
    "--------------------------------\n",
    input.payload.endsWith("\n") ? input.payload : `${input.payload}\n`,
    "--------------------------------\n",
    input.printerName ? `Printer: ${input.printerName}\n` : "",
    cut,
  ].join("");

  return {
    jobId,
    raw: header,
    bytesBase64: Buffer.from(header, "binary").toString("base64"),
  };
}
