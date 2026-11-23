import { criarCrudService } from "./crudService";
import type { NotaFiscal } from "../models/NotaFiscal";

export const notaFiscalService = criarCrudService<NotaFiscal>("notasFiscais");
