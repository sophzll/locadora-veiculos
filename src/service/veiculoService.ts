import { criarCrudService } from "./crudService";
import type { Veiculo } from "../models/Veiculo";

export const veiculoService = criarCrudService<Veiculo>("veiculos");
