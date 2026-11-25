import { useState, type SubmitEvent } from "react";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Select, type SelectOption } from "../../components/Select";
import { TextArea } from "../../components/TextArea";
import { Alert } from "../../components/Alert";
import { Modal } from "../../components/Modal";
import { manutencaoInicial, type Manutencao } from "../../models/Manutencao";
import { manutencaoService } from "../../service/manutencaoService";
import { locacaoService } from "../../service/locacaoService";
import { veiculoService } from "../../service/veiculoService";

interface ManutencaoFormProps {
  manutencao: Manutencao | null;
  opcoes: SelectOption[];
  onClose: () => void;
  onSaved: (salvo: Manutencao, editando: boolean) => void;
}

export function ManutencaoForm({ manutencao, opcoes, onClose, onSaved }: ManutencaoFormProps) {
  const [dados, setDados] = useState<Manutencao>({ ...manutencaoInicial, ...manutencao });
  const [valor, setValor] = useState(String(dados.valor));
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const editando = Boolean(manutencao?.id);

  async function salvar(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (salvando) return;
    const custo = Number(valor);
    if (!opcoes.some(o => o.value === dados.veiculoId) || !dados.data || !dados.descricao.trim()) {
      setErro("Preencha todos os campos obrigatórios."); return;
    }
    if (!valor.trim() || !Number.isFinite(custo) || custo < 0) {
      setErro("Informe um valor válido e não negativo."); return;
    }
    setSalvando(true); setErro("");
    try {
      const [veiculos, locacoes] = await Promise.all([veiculoService.listar(), locacaoService.listar()]);
      if (!veiculos.some(v => v.id === dados.veiculoId)) { setErro("O veículo selecionado não existe mais."); return; }
      if (dados.status === "EM_ANDAMENTO" && locacoes.some(l => l.veiculoId === dados.veiculoId && l.status === "ABERTA")) {
        setErro("Não é possível iniciar manutenção em um veículo locado."); return;
      }
      const payload: Manutencao = { ...dados, descricao: dados.descricao.trim(), valor: Math.round(custo * 100) / 100 };
      const salvo = manutencao?.id ? await manutencaoService.atualizar(manutencao.id, payload) : await manutencaoService.criar(payload);
      onSaved(salvo, editando);
    } catch { setErro("Não foi possível salvar a manutenção."); }
    finally { setSalvando(false); }
  }

  return (
    <Modal show title={editando ? "Editar manutenção" : "Nova manutenção"} onClose={() => { if (!salvando) onClose(); }}>
      <form onSubmit={salvar}>
        {erro && <Alert type="danger" message={erro} onClose={() => setErro("")} />}
        {!opcoes.length && <Alert type="warning" message="Cadastre um veículo antes de registrar manutenções." />}
        <Select label="Veículo" name="veiculoId" value={dados.veiculoId} options={opcoes} required disabled={salvando} onChange={e => setDados({ ...dados, veiculoId: e.target.value })} />
        <div className="row">
          <div className="col-md-6"><Input label="Data" name="data" type="date" value={dados.data} required disabled={salvando} onChange={e => setDados({ ...dados, data: e.target.value })} /></div>
          <div className="col-md-6"><Input label="Valor (R$)" name="valor" type="number" value={valor} min={0} step="0.01" required disabled={salvando} onChange={e => setValor(e.target.value)} /></div>
        </div>
        <TextArea label="Descrição do serviço" name="descricao" value={dados.descricao} rows={3} disabled={salvando} onChange={e => setDados({ ...dados, descricao: e.target.value })} />
        <Select label="Status" name="status" value={dados.status} options={[{ value: "EM_ANDAMENTO", label: "Em andamento" }, { value: "FINALIZADA", label: "Finalizada" }]} required disabled={salvando} onChange={e => setDados({ ...dados, status: e.target.value === "FINALIZADA" ? "FINALIZADA" : "EM_ANDAMENTO" })} />
        <div className="d-flex justify-content-end gap-2 border-top pt-3 mt-3">
          <Button label="Cancelar" variant="secondary" disabled={salvando} onClick={onClose} />
          <Button label={salvando ? "Salvando..." : "Salvar manutenção"} type="submit" disabled={salvando || !opcoes.length} />
        </div>
      </form>
    </Modal>
  );
}
