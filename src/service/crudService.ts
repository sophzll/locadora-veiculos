import { api } from "./api";

export interface CrudService<T> {
  listar: () => Promise<T[]>;
  buscarPorId: (id: string) => Promise<T>;
  criar: (obj: T) => Promise<T>;
  atualizar: (id: string, obj: T) => Promise<T>;
  excluir: (id: string) => Promise<void>;
}

export function criarCrudService<T>(recurso: string): CrudService<T> {
  return {
    listar: async (): Promise<T[]> => (await api.get<T[]>(`/${recurso}`)).data,
    buscarPorId: async (id: string): Promise<T> =>
      (await api.get<T>(`/${recurso}/${id}`)).data,
    criar: async (obj: T): Promise<T> => (await api.post<T>(`/${recurso}`, obj)).data,
    atualizar: async (id: string, obj: T): Promise<T> =>
      (await api.put<T>(`/${recurso}/${id}`, obj)).data,
    excluir: async (id: string): Promise<void> => {
      await api.delete(`/${recurso}/${id}`);
    },
  };
}
