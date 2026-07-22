import { createHomologProvider } from "../homolog/create-homolog-provider";
import type { IntegrationProvider, PrinterDriver } from "../types";
import { buildEscPosJob } from "./escpos-builder";

export const bematechProviderPrinter: PrinterDriver = {
  async imprimir(_ctx, job) {
    const built = buildEscPosJob({
      type: job.type,
      payload: job.payload,
      printerName: "Bematech",
    });
    return { jobId: built.jobId };
  },
};

export const bematechProvider: IntegrationProvider = createHomologProvider({
  id: "bematech",
  category: "printer",
});
