import { createStubProvider } from "../create-stub-provider";
import {
  IntegrationNotAvailableError,
  type IntegrationProvider,
  type PrinterDriver,
} from "../types";

export const elginProviderPrinter: PrinterDriver = {
  async imprimir() {
    throw new IntegrationNotAvailableError("elgin", "Impressão térmica");
  },
};

export const elginProvider: IntegrationProvider = createStubProvider("elgin", "printer");
