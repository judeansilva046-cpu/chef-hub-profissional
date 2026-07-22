import { createHomologProvider } from "../homolog/create-homolog-provider";
import type { IntegrationProvider, PrinterDriver } from "../types";
import { buildEscPosJob } from "./escpos-builder";

export const elginProviderPrinter: PrinterDriver = {
  async imprimir(_ctx, job) {
    const built = buildEscPosJob({
      type: job.type,
      payload: job.payload,
      printerName: "Elgin",
    });
    return { jobId: built.jobId };
  },
};

export const elginProvider: IntegrationProvider = createHomologProvider({
  id: "elgin",
  category: "printer",
});
