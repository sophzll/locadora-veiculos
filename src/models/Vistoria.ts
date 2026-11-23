export type TipoVistoria = "RETIRADA" | "DEVOLUCAO";
export type NivelCombustivel = "VAZIO" | "1/4" | "1/2" | "3/4" | "CHEIO";

export interface Vistoria {
  id?: string;
  tipo: TipoVistoria;
  data: string;
  km: number;
  nivelCombustivel: NivelCombustivel;
  observacoes: string;
  locacaoId: string;
}

export const vistoriaInicial: Vistoria = {
  tipo: "RETIRADA",
  data: "",
  km: 0,
  nivelCombustivel: "CHEIO",
  observacoes: "",
  locacaoId: "",
};
