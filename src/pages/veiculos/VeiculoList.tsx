import { Link } from "react-router-dom";
import type { Manutencao } from "../../models/Manutencao";
import { useEffect, useRef, useState } from "react";
import { VeiculoForm } from "./VeiculoForm";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Card } from "../../components/Card";
import { Alert } from "../../components/Alert";
import { Modal } from "../../components/Modal";
import type { Veiculo } from "../../models/Veiculo";
import type { Modelo } from "../../models/Modelo";
import type { Marca } from "../../models/Marca";
import type { Categoria } from "../../models/Categoria";
import type { Locacao } from "../../models/Locacao";
import { veiculoService } from "../../service/veiculoService";
import { modeloService } from "../../service/modeloService";
import { marcaService } from "../../service/marcaService";
import { categoriaService } from "../../service/categoriaService";
import { locacaoService } from "../../service/locacaoService";
import { manutencaoService } from "../../service/manutencaoService";

const fotos = import.meta.glob<string>("../../assets/frota/*.webp", { eager: true, query: "?url", import: "default" });

function buscarFotoModelo(nome: string): string | undefined {
  const arquivo = nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, "-");
  return fotos[`../../assets/frota/${arquivo}.webp`];
}

export function VeiculoList() {
  const [formulario, setFormulario] = useState<{ veiculo: Veiculo | null } | null>(null);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [locacoes, setLocacoes] = useState<Locacao[]>([]);
  const [pesquisa, setPesquisa] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [falha, setFalha] = useState(false);
  const [selecionado, setSelecionado] = useState<Veiculo | null>(null);
  const [mensagem, setMensagem] = useState<{ type: "success" | "danger" | "warning"; message: string } | null>(null);
  const excluindo = useRef(false);

  useEffect(() => {
    let ativo = true;
    Promise.all([veiculoService.listar(), modeloService.listar(), marcaService.listar(), categoriaService.listar(), locacaoService.listar(), manutencaoService.listar()])
      .then(([v, mo, ma, c, l, mt]) => { if (ativo) { setVeiculos(v); setModelos(mo); setMarcas(ma); setCategorias(c); setLocacoes(l); setManutencoes(mt); } })
      .catch(() => { if (ativo) { setFalha(true); setMensagem({ type: "danger", message: "Não foi possível carregar os veículos." }); } })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, []);

  async function excluir() {
    if (!selecionado?.id || excluindo.current) return;
    const id = selecionado.id;
    excluindo.current = true; setSelecionado(null);
    try {
      const [manutencoes, locacoesAtuais] = await Promise.all([manutencaoService.listar(), locacaoService.listar()]);
      if (manutencoes.some((m) => m.veiculoId === id) || locacoesAtuais.some((l) => l.veiculoId === id)) {
        setMensagem({ type: "warning", message: "Este veículo possui manutenções ou locações vinculadas e não pode ser excluído." }); return;
      }
      await veiculoService.excluir(id);
      setVeiculos((anteriores) => anteriores.filter((v) => v.id !== id));
      setMensagem({ type: "success", message: "Veículo excluído com sucesso!" });
    } catch { setMensagem({ type: "danger", message: "Não foi possível excluir o veículo." }); }
    finally { excluindo.current = false; }
  }

  const modelo = (v: Veiculo) => modelos.find((m) => m.id === v.modeloId);
  const nomeModelo = (v: Veiculo) => modelo(v)?.nome ?? "—";
  const nomeMarca = (v: Veiculo) => marcas.find((m) => m.id === modelo(v)?.marcaId)?.nome ?? "—";
  const nomeCategoria = (v: Veiculo) => categorias.find((c) => c.id === modelo(v)?.categoriaId)?.nome ?? "—";
  const locado = (v: Veiculo) => locacoes.some((l) => l.veiculoId === v.id && l.status === "ABERTA");
  const statusVeiculo = (v: Veiculo) => {
    const emManutencao = manutencoes.some((m) => m.veiculoId === v.id && m.status === "EM_ANDAMENTO");
    if (emManutencao) return { texto: "Em manutenção", classe: "text-bg-warning" };
    if (locado(v)) return { texto: "Locado", classe: "text-bg-primary" };
    return { texto: "Disponível", classe: "text-bg-success" };
  };
  const filtrados = veiculos.filter((v) => `${v.placa} ${v.chassi} ${nomeModelo(v)} ${nomeMarca(v)} ${nomeCategoria(v)} ${v.cor} ${v.anoFabricacao}`.toLocaleLowerCase("pt-BR").includes(pesquisa.trim().toLocaleLowerCase("pt-BR")));

  return (
    <section className="container-xl py-5">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div><h2 className="mb-1">Veículos</h2><p className="text-body-secondary mb-0">Gerencie os veículos da sua frota.</p></div>
        <Button label="+ Novo veículo" disabled={carregando || falha} onClick={() => setFormulario({ veiculo: null })} />
      </div>
      {mensagem && <Alert {...mensagem} onClose={() => setMensagem(null)} />}
      <div className="border rounded-3 p-3 mb-4 bg-body-tertiary d-inline-flex flex-column"><span className="small text-body-secondary">Total de veículos cadastrados</span><strong className="fs-2 text-primary">{falha || carregando ? "—" : String(veiculos.length).padStart(2, "0")}</strong></div>
      <Card title="Veículos cadastrados">
        <Input label="Pesquisar veículo" name="pesquisa" value={pesquisa} placeholder="Placa, chassi, modelo, marca, categoria, cor ou ano" onChange={(e) => setPesquisa(e.target.value)} />
        {carregando ? <p role="status">Carregando veículos...</p> : !falha && (
          filtrados.length === 0 ? <p className="text-body-secondary">Nenhum veículo encontrado.</p> : (
            <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-4 my-2">
              {filtrados.map((v) => {
                const foto = buscarFotoModelo(nomeModelo(v));
                const status = statusVeiculo(v);
                return (
                  <div className="col" key={v.id}>
                    <article className="card h-100 overflow-hidden shadow-sm">
                      <div className="card-body pb-3">
                        <div className="d-flex flex-wrap align-items-start justify-content-between gap-2">
                          <div>
                            <h4 className="mb-1">{nomeModelo(v)}</h4>
                            <p className="small text-body-secondary mb-0">{nomeMarca(v)} · {nomeCategoria(v)}</p>
                          </div>
                          <span className={`badge ${status.classe}`}>{status.texto}</span>
                        </div>
                      </div>
                      <div className="ratio ratio-4x3" style={{ background: "radial-gradient(ellipse at center, #12396b, #080b12 75%)" }}>
                        {foto ? (
                          <img src={foto} alt={`Imagem ilustrativa do ${nomeMarca(v)} ${nomeModelo(v)}`} className="w-100 h-100 object-fit-contain" loading="lazy" />
                        ) : (
                          <div className="d-flex flex-column align-items-center justify-content-center text-center p-3 text-light">
                            <i className="bi bi-car-front fs-1 mb-2" aria-hidden="true" />
                            <span>Este modelo ainda não possui foto cadastrada.</span>
                          </div>
                        )}
                      </div>
                      <div className="card-body d-flex flex-column gap-3">
                        <dl className="row small gy-2 mb-0">
                          <dt className="col-4 text-body-secondary">Placa</dt><dd className="col-8 mb-0 fw-semibold">{v.placa}</dd>
                          <dt className="col-4 text-body-secondary">Chassi</dt><dd className="col-8 mb-0 text-break">{v.chassi}</dd>
                          <dt className="col-4 text-body-secondary">Ano</dt><dd className="col-8 mb-0">{v.anoFabricacao}</dd>
                          <dt className="col-4 text-body-secondary">Cor</dt><dd className="col-8 mb-0">{v.cor}</dd>
                          <dt className="col-4 text-body-secondary">Km rodado</dt><dd className="col-8 mb-0">{v.kmRodado.toLocaleString("pt-BR")} km</dd>
                        </dl>
                        <div className="border-top pt-3 mt-auto d-flex flex-wrap gap-2">
                          <Button label="Editar" variant="outline-primary" size="sm" onClick={() => setFormulario({ veiculo: v })} />
                          <Button label="Excluir" variant="outline-light" size="sm" onClick={() => setSelecionado(v)} />
                          {v.id && <Link className="btn btn-sm btn-outline-light" to={`/manutencoes?veiculoId=${encodeURIComponent(v.id)}`}>Manutenções</Link>}
                        </div>
                      </div>
                    </article>
                  </div>
                );
              })}
            </div>
          )
        )}
        {!carregando && !falha && <p className="small text-body-secondary mb-0">Exibindo {filtrados.length} de {veiculos.length} registros.</p>}
      </Card>
      {formulario && <VeiculoForm veiculo={formulario.veiculo} modelos={modelos} marcas={marcas} onClose={() => setFormulario(null)} onSaved={(salvo, editando) => {
        setVeiculos((anteriores) => editando ? anteriores.map((v) => v.id === salvo.id ? salvo : v) : [...anteriores, salvo]);
        setFormulario(null);
        setMensagem({ type: "success", message: editando ? "Veículo atualizado com sucesso!" : "Veículo cadastrado com sucesso!" });
      }} />}
      <Modal show={selecionado !== null} title="Excluir veículo" onClose={() => setSelecionado(null)} onConfirm={() => void excluir()} confirmLabel="Excluir">
        <p className="mb-0">Deseja excluir o veículo de placa <strong>{selecionado?.placa}</strong>?</p>
      </Modal>
    </section>
  );
}
