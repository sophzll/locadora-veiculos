import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ManutencaoForm } from "./ManutencaoForm";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Select } from "../../components/Select";
import { Table, type Column } from "../../components/Table";
import { Card } from "../../components/Card";
import { Alert } from "../../components/Alert";
import { Modal } from "../../components/Modal";
import type { Manutencao } from "../../models/Manutencao";
import type { Veiculo } from "../../models/Veiculo";
import type { Modelo } from "../../models/Modelo";
import type { Marca } from "../../models/Marca";
import { manutencaoService } from "../../service/manutencaoService";
import { veiculoService } from "../../service/veiculoService";
import { modeloService } from "../../service/modeloService";
import { marcaService } from "../../service/marcaService";

export function ManutencaoList() {
  const [params, setParams] = useSearchParams();
  const filtro = params.get("veiculoId") ?? "";
  const [registros, setRegistros] = useState<Manutencao[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [formulario, setFormulario] = useState<{ manutencao: Manutencao | null } | null>(null);
  const [selecionado, setSelecionado] = useState<Manutencao | null>(null);
  const [pesquisa, setPesquisa] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [falha, setFalha] = useState(false);
  const [mensagem, setMensagem] = useState<{ type: "success" | "danger" | "warning"; message: string } | null>(null);
  const excluindo = useRef(false);

  useEffect(() => {
    let ativo = true;
    Promise.all([manutencaoService.listar(), veiculoService.listar(), modeloService.listar(), marcaService.listar()])
      .then(([r, v, mo, ma]) => { if (ativo) { setRegistros(r); setVeiculos(v); setModelos(mo); setMarcas(ma); } })
      .catch(() => { if (ativo) { setFalha(true); setMensagem({ type: "danger", message: "Não foi possível carregar as manutenções." }); } })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, []);

  function nomeVeiculo(id: string) {
    const v = veiculos.find(item => item.id === id);
    if (!v) return "Veículo não encontrado";
    const modelo = modelos.find(m => m.id === v.modeloId);
    const marca = marcas.find(m => m.id === modelo?.marcaId);
    return `${v.placa} — ${marca?.nome ?? ""} ${modelo?.nome ?? ""}`.trim();
  }
  const opcoes = veiculos.flatMap(v => v.id ? [{ value: v.id, label: nomeVeiculo(v.id) }] : []);
  const filtrados = registros.filter(m => (!filtro || m.veiculoId === filtro) && `${nomeVeiculo(m.veiculoId)} ${m.descricao}`.toLocaleLowerCase("pt-BR").includes(pesquisa.trim().toLocaleLowerCase("pt-BR")));
  const columns: Column<Manutencao>[] = [
    { header: "Veículo", render: m => nomeVeiculo(m.veiculoId) },
    { header: "Data", render: m => m.data.split("T")[0].split("-").reverse().join("/") },
    { header: "Descrição", render: m => m.descricao },
    { header: "Valor", render: m => m.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) },
    { header: "Status", render: m => <span className={`badge ${m.status === "EM_ANDAMENTO" ? "text-bg-warning" : "text-bg-secondary"}`}>{m.status === "EM_ANDAMENTO" ? "Em andamento" : "Finalizada"}</span> },
  ];

  async function excluir() {
    if (!selecionado?.id || excluindo.current) return;
    const id = selecionado.id;
    excluindo.current = true; setSelecionado(null);
    try {
      await manutencaoService.excluir(id);
      setRegistros(old => old.filter(m => m.id !== id));
      setMensagem({ type: "success", message: "Manutenção excluída com sucesso!" });
    } catch { setMensagem({ type: "danger", message: "Não foi possível excluir a manutenção." }); }
    finally { excluindo.current = false; }
  }

  return (
    <section className="container-xl py-5">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div><h2 className="mb-1">Manutenções</h2><p className="text-body-secondary mb-0">Gerencie o histórico de manutenção da sua frota.</p></div>
        <Button label="+ Nova manutenção" disabled={carregando || falha} onClick={() => setFormulario({ manutencao: null })} />
      </div>
      {mensagem && <Alert {...mensagem} onClose={() => setMensagem(null)} />}
      <div className="border rounded-3 p-3 mb-4 bg-body-tertiary d-inline-flex flex-column"><span className="small text-body-secondary">Total de manutenções cadastradas</span><strong className="fs-2 text-primary">{carregando || falha ? "—" : String(registros.length).padStart(2, "0")}</strong></div>
      <Card title="Histórico de manutenções">
        <div className="row">
          <div className="col-md-6"><Select label="Filtrar por veículo" name="filtroVeiculo" value={filtro} options={opcoes} placeholder="Todos os veículos" onChange={e => setParams(e.target.value ? { veiculoId: e.target.value } : {})} /></div>
          <div className="col-md-6"><Input label="Pesquisar manutenção" name="pesquisa" value={pesquisa} placeholder="Placa, modelo ou descrição" onChange={e => setPesquisa(e.target.value)} /></div>
        </div>
        {carregando ? <p role="status">Carregando manutenções...</p> : !falha && <Table columns={columns} data={filtrados} onEdit={manutencao => setFormulario({ manutencao })} onDelete={setSelecionado} />}
        {!carregando && !falha && <p className="small text-body-secondary mb-0">Exibindo {filtrados.length} de {registros.length} registros.</p>}
      </Card>
      {formulario && <ManutencaoForm manutencao={formulario.manutencao} opcoes={opcoes} onClose={() => setFormulario(null)} onSaved={(salvo, editando) => {
        setRegistros(old => editando ? old.map(m => m.id === salvo.id ? salvo : m) : [...old, salvo]);
        setFormulario(null); setMensagem({ type: "success", message: editando ? "Manutenção atualizada com sucesso!" : "Manutenção cadastrada com sucesso!" });
      }} />}
      <Modal show={selecionado !== null} title="Excluir manutenção" onClose={() => setSelecionado(null)} onConfirm={() => void excluir()} confirmLabel="Excluir"><p className="mb-0">Deseja excluir esta manutenção do histórico?</p></Modal>
    </section>
  );
}
