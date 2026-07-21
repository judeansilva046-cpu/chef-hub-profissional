export const TIPOS_CONTRATO = [
  { value: "clt", label: "CLT" },
  { value: "pj", label: "PJ" },
  { value: "temporario", label: "Temporário" },
  { value: "estagio", label: "Estágio" },
  { value: "outro", label: "Outro" },
] as const;

export type TipoContrato = (typeof TIPOS_CONTRATO)[number]["value"];

export const TIPO_CONTRATO_LABEL: Record<TipoContrato, string> = {
  clt: "CLT",
  pj: "PJ",
  temporario: "Temporário",
  estagio: "Estágio",
  outro: "Outro",
};

export interface CustoMensalInput {
  salarioBruto: number;
  beneficiosMensais: number;
  percentualEncargos: number;
}

export interface CustoMensalResultado {
  encargos: number;
  custoTotalMensal: number;
}
