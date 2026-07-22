import { createHomologProvider } from "../homolog/create-homolog-provider";
import type { IntegrationProvider, PrinterDriver } from "../types";
import { buildEscPosJob } from "./escpos-builder";

export const escposProviderPrinter: PrinterDriver = {
  async imprimir(_ctx, job) {
    const built = buildEscPosJob({
      type: job.type,
      payload: job.payload,
      printerName: "ESC/POS",
    });
    return { jobId: built.jobId };
  },
};

export const escposProvider: IntegrationProvider = createHomologProvider({
  id: "escpos",
  category: "printer",
});
