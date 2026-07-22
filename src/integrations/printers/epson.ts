import { createHomologProvider } from "../homolog/create-homolog-provider";
import type { IntegrationProvider, PrinterDriver } from "../types";
import { buildEscPosJob } from "./escpos-builder";

export const epsonProviderPrinter: PrinterDriver = {
  async imprimir(_ctx, job) {
    const built = buildEscPosJob({
      type: job.type,
      payload: job.payload,
      printerName: "Epson",
    });
    return { jobId: built.jobId };
  },
};

export const epsonProvider: IntegrationProvider = createHomologProvider({
  id: "epson",
  category: "printer",
});
