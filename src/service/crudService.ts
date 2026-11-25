import { api } from "./api";

export interface CrudService<T> {
  listar: () => Promise<T[]>;
  buscarPorId: (id: string) => Promise<T>;
  criar: (obj: T) => Promise<T>;
  atualizar: (id: string, obj: T) => Promise<T>;
  excluir: (id: string) => Promise<void>;
}

function normalizarIds<T extends object>(registro: T): T {
  const copia = { ...registro };
  for (const [campo, valor] of Object.entries(registro)) {
    if ((campo === "id" || campo.endsWith("Id")) && typeof valor === "number") {
      Object.assign(copia, { [campo]: String(valor) });
    }
  }
  return copia;
}

export function criarCrudService<T extends object>(recurso: string): CrudService<T> {
  return {
    listar: async (): Promise<T[]> => (await api.get<T[]>(`/${recurso}`)).data.map(normalizarIds),
    buscarPorId: async (id: string): Promise<T> =>
      normalizarIds((await api.get<T>(`/${recurso}/${id}`)).data),
    criar: async (obj: T): Promise<T> => normalizarIds((await api.post<T>(`/${recurso}`, obj)).data),
    atualizar: async (id: string, obj: T): Promise<T> =>
      normalizarIds((await api.put<T>(`/${recurso}/${id}`, obj)).data),
    excluir: async (id: string): Promise<void> => {
      await api.delete(`/${recurso}/${id}`);
    },
  };
}
