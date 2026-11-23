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
