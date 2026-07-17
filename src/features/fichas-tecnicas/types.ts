/** Estado de um item no formulário, antes de salvar (id local, não do banco). */
export interface FichaTecnicaItemFormState {
  uid: string;
  ingredienteId: string;
  pesoBruto: number | null;
  percentualPerda: number;
}

export interface FichaTecnicaFormState {
  nome: string;
  modoPreparo: string;
  tempoPreparoMinutos: number | null;
  rendimentoQuantidade: number | null;
  rendimentoUnidadeId: string;
  precoVendaPraticado: number | null;
  margemContribuicaoPercentualAlvo: number | null;
  itens: FichaTecnicaItemFormState[];
}

export function criarItemVazio(): FichaTecnicaItemFormState {
  return {
    uid: crypto.randomUUID(),
    ingredienteId: "",
    pesoBruto: null,
    percentualPerda: 0,
  };
}

export function criarFormularioVazio(): FichaTecnicaFormState {
  return {
    nome: "",
    modoPreparo: "",
    tempoPreparoMinutos: null,
    rendimentoQuantidade: null,
    rendimentoUnidadeId: "",
    precoVendaPraticado: null,
    margemContribuicaoPercentualAlvo: null,
    itens: [criarItemVazio()],
  };
}
