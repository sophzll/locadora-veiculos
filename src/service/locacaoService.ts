import { criarCrudService } from "./crudService";
import type { Locacao } from "../models/Locacao";

export const locacaoService = criarCrudService<Locacao>("locacoes");
