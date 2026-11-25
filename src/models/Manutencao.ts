export type StatusManutencao = "EM_ANDAMENTO" | "FINALIZADA";
export interface Manutencao {
  id?: string;
  data: string;
  descricao: string;
  valor: number;
  veiculoId: string;
  status: StatusManutencao;
}

export const manutencaoInicial: Manutencao = {
  data: "",
  descricao: "",
  valor: 0,
  veiculoId: "",
  status: "EM_ANDAMENTO",
};
