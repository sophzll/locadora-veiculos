import { mascaraPlaca, mascaraChassi, mascaraAno } from "../../utils/mascaras";
import { useState, type SubmitEvent } from "react";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Select } from "../../components/Select";
import { Alert } from "../../components/Alert";
import { Modal } from "../../components/Modal";
import { veiculoInicial, type Veiculo } from "../../models/Veiculo";
import type { Modelo } from "../../models/Modelo";
import type { Marca } from "../../models/Marca";
import { veiculoService } from "../../service/veiculoService";

interface VeiculoFormProps {
  veiculo: Veiculo | null;
  modelos: Modelo[];
  marcas: Marca[];
  onClose: () => void;
  onSaved: (veiculo: Veiculo, editando: boolean) => void;
}

const normalizar = (valor: string) => valor.replace(/[\s-]/g, "").toUpperCase();

export function VeiculoForm({ veiculo, modelos, marcas, onClose, onSaved }: VeiculoFormProps) {
  const [dados, setDados] = useState<Veiculo>({ ...(veiculo ?? veiculoInicial), placa: mascaraPlaca(veiculo?.placa ?? ""), chassi: mascaraChassi(veiculo?.chassi ?? "") });
  const [ano, setAno] = useState(String(dados.anoFabricacao));
  const [km, setKm] = useState(String(dados.kmRodado));
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const editando = Boolean(veiculo?.id);
  const opcoes = modelos.flatMap((m) => m.id ? [{
     value: m.id, 
     label: `${marcas.find((marca) => marca.id === m.marcaId)?.nome ?? ""} ${m.nome}`.trim() 
    }] : []);

  async function salvar(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (salvando) return;
    const placa = normalizar(dados.placa);
    const chassi = normalizar(dados.chassi);
    const cor = dados.cor.trim();
    const anoFabricacao = Number(ano);
    const kmRodado = Number(km);
    if (!placa || !chassi || !cor || !opcoes.some((o) => o.value === dados.modeloId)) {
      setErro("Preencha todos os campos e selecione um modelo válido."); return;
    }
    if (!/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(placa)) {
      setErro("Informe uma placa válida (ABC1234 ou ABC1D23)."); return;
    }
    if (!/^[A-Z0-9]{17}$/.test(chassi)) {
      setErro("O chassi deve conter 17 caracteres alfanuméricos."); return;
    }
    if (ano.length !== 4 || !Number.isInteger(anoFabricacao) || anoFabricacao < 1886 || anoFabricacao > new Date().getFullYear() + 1) {
      setErro("Informe um ano de fabricação válido."); return;
    }
    if (!km.trim() || !Number.isSafeInteger(kmRodado) || kmRodado < 0) {
      setErro("Informe uma quilometragem inteira e não negativa."); return;
    }
    setSalvando(true); setErro("");
    try {
      const existentes = await veiculoService.listar();
      if (existentes.some((v) => v.id !== veiculo?.id && normalizar(v.placa) === placa)) {
        setErro("Esta placa já está cadastrada."); return;
      }
      if (existentes.some((v) => v.id !== veiculo?.id && normalizar(v.chassi) === chassi)) {
        setErro("Este chassi já está cadastrado."); return;
      }
      const payload: Veiculo = { placa, chassi, cor, anoFabricacao, kmRodado, modeloId: dados.modeloId };
      const salvo = veiculo?.id ? await veiculoService.atualizar(veiculo.id, { ...payload, id: veiculo.id }) : await veiculoService.criar(payload);
      onSaved(salvo, editando);
    } catch { setErro("Não foi possível salvar o veículo. Tente novamente."); }
    finally { setSalvando(false); }
  }

  return (
    <Modal show title={editando ? "Editar veículo" : "Novo veículo"} onClose={() => { if (!salvando) onClose(); }}>
      <form onSubmit={salvar}>
        {erro && <Alert type="danger" message={erro} onClose={() => setErro("")} />}
        {!opcoes.length && <Alert type="warning" message="Cadastre um modelo antes de cadastrar veículos." />}
        <Select label="Modelo" name="modeloId" value={dados.modeloId} options={opcoes} required disabled={salvando} onChange={(e) => setDados({ ...dados, modeloId: e.target.value })} />
        <div className="row">
          <div className="col-md-5"><Input label="Placa" name="placa" value={dados.placa} maxLength={7} placeholder="Ex: ABC1D23" required disabled={salvando} onChange={(e) => setDados({ ...dados, placa: mascaraPlaca(e.target.value) })} /></div>
          <div className="col-md-7"><Input label="Chassi" name="chassi" value={dados.chassi} maxLength={17} required disabled={salvando} onChange={(e) => setDados({ ...dados, chassi: mascaraChassi(e.target.value) })} /></div>
          <div className="col-md-6"><Input label="Ano de fabricação" name="anoFabricacao" type="text" value={ano} maxLength={4} inputMode="numeric" required disabled={salvando} onChange={(e) => setAno(mascaraAno(e.target.value))} /></div>
          <div className="col-md-6"><Input label="Cor" name="cor" value={dados.cor} required disabled={salvando} onChange={(e) => setDados({ ...dados, cor: e.target.value })} /></div>
        </div>
        <Input label="Quilometragem (km)" name="kmRodado" type="number" value={km} min={0} step={1} required disabled={salvando} onChange={(e) => setKm(e.target.value)} />
        <div className="d-flex justify-content-end gap-2 border-top pt-3 mt-3">
          <Button label="Cancelar" variant="secondary" disabled={salvando} onClick={onClose} />
          <Button label={salvando ? "Salvando..." : "Salvar veículo"} variant="primary" type="submit" disabled={salvando || !opcoes.length} />
        </div>
      </form>
    </Modal>
  );
}
