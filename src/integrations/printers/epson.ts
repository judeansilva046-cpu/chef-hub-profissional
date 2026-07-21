import { createStubProvider } from "../create-stub-provider";
import {
  IntegrationNotAvailableError,
  type IntegrationProvider,
  type PrinterDriver,
} from "../types";

export const epsonProviderPrinter: PrinterDriver = {
  async imprimir() {
    throw new IntegrationNotAvailableError("epson", "Impressão térmica");
  },
};

export const epsonProvider: IntegrationProvider = createStubProvider("epson", "printer");
