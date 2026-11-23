export type StatusLocacao = "ABERTA" | "FINALIZADA" | "CANCELADA";

export interface Locacao {
  id?: string;
  dataRetirada: string;
  dataDevolucaoPrevista: string;
  dataDevolucaoReal?: string;
  kmRetirada: number;
  kmDevolucao?: number;
  valorTotal: number;
  status: StatusLocacao;
  clienteId: string;
  veiculoId: string;
}

export const locacaoInicial: Locacao = {
  dataRetirada: "",
  dataDevolucaoPrevista: "",
  kmRetirada: 0,
  valorTotal: 0,
  status: "ABERTA",
  clienteId: "",
  veiculoId: "",
};

// Número de diárias (arredonda para cima; devolve 0 se as datas forem inválidas)
export function calcularDiarias(dataRetirada: string, dataDevolucao: string): number {
  const ms = new Date(dataDevolucao).getTime() - new Date(dataRetirada).getTime();
  if (Number.isNaN(ms) || ms <= 0) return 0;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

// RF08: nº de diárias x valor da diária da categoria
export function calcularValorLocacao(
  dataRetirada: string,
  dataDevolucao: string,
  valorDiaria: number
): number {
  return calcularDiarias(dataRetirada, dataDevolucao) * valorDiaria;
}
