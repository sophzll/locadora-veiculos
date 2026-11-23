import { criarCrudService } from "./crudService";
import type { Vistoria } from "../models/Vistoria";

export const vistoriaService = criarCrudService<Vistoria>("vistorias");
