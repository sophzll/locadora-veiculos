import { criarCrudService } from "./crudService";
import type { Categoria } from "../models/Categoria";

export const categoriaService = criarCrudService<Categoria>("categorias");
