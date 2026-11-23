import { criarCrudService } from "./crudService";
import type { Cliente } from "../models/Cliente";

export const clienteService = criarCrudService<Cliente>("clientes");
