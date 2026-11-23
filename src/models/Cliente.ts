export interface Cliente {
  id?: string;
  nome: string;
  cpf: string;
  cnh: string;
  validadeCnh: string;
  telefone: string;
  email: string;
  endereco: string;
}

export const clienteInicial: Cliente = {
  nome: "",
  cpf: "",
  cnh: "",
  validadeCnh: "",
  telefone: "",
  email: "",
  endereco: "",
};

// RN03: CNH vencida (datas no formato YYYY-MM-DD)
export function cnhVencida(cliente: Cliente): boolean {
  const hoje = new Date().toLocaleDateString("en-CA");
  return cliente.validadeCnh < hoje;
}
