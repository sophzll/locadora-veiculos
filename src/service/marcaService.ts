import { criarCrudService } from "./crudService";
import type { Marca } from "../models/Marca";

export const marcaService = criarCrudService<Marca>("marcas");
