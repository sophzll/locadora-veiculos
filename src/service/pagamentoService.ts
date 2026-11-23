import { criarCrudService } from "./crudService";
import type { Pagamento } from "../models/Pagamento";

export const pagamentoService = criarCrudService<Pagamento>("pagamentos");
