import { createStubProvider } from "../create-stub-provider";
import {
  IntegrationNotAvailableError,
  type IntegrationProvider,
  type PrinterDriver,
} from "../types";

export const escposProviderPrinter: PrinterDriver = {
  async imprimir() {
    throw new IntegrationNotAvailableError("escpos", "Impressão térmica");
  },
};

export const escposProvider: IntegrationProvider = createStubProvider("escpos", "printer");
