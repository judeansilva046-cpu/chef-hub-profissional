export interface SolicitacaoItemFormState {
  uid: string;
  ingredienteId: string;
  quantidade: number | null;
}

export function criarItemSolicitacaoVazio(): SolicitacaoItemFormState {
  return { uid: crypto.randomUUID(), ingredienteId: "", quantidade: null };
}

export interface PedidoItemFormState {
  uid: string;
  ingredienteId: string;
  quantidade: number | null;
  precoUnitario: number | null;
}

export function criarItemPedidoVazio(): PedidoItemFormState {
  return {
    uid: crypto.randomUUID(),
    ingredienteId: "",
    quantidade: null,
    precoUnitario: null,
  };
}
