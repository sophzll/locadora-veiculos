import { criarCrudService } from "./crudService";
import type { Manutencao } from "../models/Manutencao";

export const manutencaoService = criarCrudService<Manutencao>("manutencoes");
