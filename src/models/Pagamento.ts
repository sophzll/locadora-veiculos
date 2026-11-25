export type FormaPagamento = "DINHEIRO" | "PIX" | "CARTAO_CREDITO" | "CARTAO_DEBITO";
export type StatusPagamento = "PENDENTE" | "PAGO" | "CANCELADO";

export interface Pagamento {
  id?: string;
  data: string;
  valor: number;
  forma: FormaPagamento;
  status: StatusPagamento;
  locacaoId: string;
}

export const pagamentoInicial: Pagamento = {
  data: "",
  valor: 0,
  forma: "PIX",
  status: "PAGO",
  locacaoId: "",
};

export const formasPagamento: Record<FormaPagamento, string> = {
    DINHEIRO: "Dinheiro", PIX: "Pix",
    CARTAO_CREDITO: "Cartão de crédito", CARTAO_DEBITO: "Cartão de débito"
};
export const statusPagamento: Record<StatusPagamento, string> = {
    PENDENTE: "Pendente", PAGO: "Pago", CANCELADO: "Cancelado"
};

