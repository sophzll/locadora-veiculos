import { criarCrudService } from "./crudService";
import type { Contrato } from "../models/Contrato";

export const contratoService = criarCrudService<Contrato>("contratos");
