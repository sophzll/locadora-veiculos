export interface Contrato {
  id?: string;
  numero: string;
  dataEmissao: string;
  termos: string;
  locacaoId: string;
}

export const contratoInicial: Contrato = {
  numero: "",
  dataEmissao: "",
  termos: "",
  locacaoId: "",
};
