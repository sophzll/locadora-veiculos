import { criarCrudService } from "./crudService";
import type { Modelo } from "../models/Modelo";

export const modeloService = criarCrudService<Modelo>("modelos");
