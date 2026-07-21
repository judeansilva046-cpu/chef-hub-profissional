import { createStubProvider } from "../create-stub-provider";
import {
  IntegrationNotAvailableError,
  type IntegrationProvider,
  type PrinterDriver,
} from "../types";

export const bematechProviderPrinter: PrinterDriver = {
  async imprimir() {
    throw new IntegrationNotAvailableError("bematech", "Impressão térmica");
  },
};

export const bematechProvider: IntegrationProvider = createStubProvider("bematech", "printer");
