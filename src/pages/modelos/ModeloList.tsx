import { useEffect, useRef, useState } from "react";
import { ModeloForm } from "./ModeloForm";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Table, type Column } from "../../components/Table";
import { Card } from "../../components/Card";
import { Alert } from "../../components/Alert";
import { Modal } from "../../components/Modal";
import type { Modelo } from "../../models/Modelo";
import { modeloService } from "../../service/modeloService";
import { veiculoService } from "../../service/veiculoService";
import { marcaService } from "../../service/marcaService";
import { categoriaService } from "../../service/categoriaService";
import type { Marca } from "../../models/Marca";
import type { Categoria } from "../../models/Categoria";

export function ModeloList() {
  const [formulario, setFormulario] = useState<{ modelo: Modelo | null } | null>(null);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [pesquisa, setPesquisa] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [selecionado, setSelecionado] = useState<Modelo | null>(null);
  const [mensagem, setMensagem] = useState<{ type: "success" | "danger" | "warning"; message: string } | null>(
    null
  );
  const excluindo = useRef(false);

  useEffect(() => {
    let ativo = true;
    Promise.all([modeloService.listar(), marcaService.listar(), categoriaService.listar()]).then(([dados, marcas, categorias]) => {
      if (ativo) { setModelos(dados); setMarcas(marcas); setCategorias(categorias); }
    }).catch(() => {
      if (ativo) setMensagem({ type: "danger", message: "Não foi possível carregar os modelos." });
    }).finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, []);

  async function excluir() {
    if (!selecionado?.id || excluindo.current) return;
    const id = selecionado.id;
    excluindo.current = true;
    setSelecionado(null);
    try {
      const veiculos = await veiculoService.listar();
      if (veiculos.some((veiculo) => veiculo.modeloId === id)) {
        setMensagem({ type: "warning", message: "Este modelo possui veículos vinculados e não pode ser excluído." });
        return;
      }
      await modeloService.excluir(id);
      setModelos((anteriores) => anteriores.filter((modelo) => modelo.id !== id));
      setMensagem({ type: "success", message: "Modelo excluído com sucesso!" });
    } catch {
      setMensagem({ type: "danger", message: "Não foi possível excluir o modelo." });
    } finally { excluindo.current = false; }
  }

  const nomeMarca = (id: string) => marcas.find((marca) => marca.id === id)?.nome ?? "—";
  const nomeCategoria = (id: string) => categorias.find((categoria) => categoria.id === id)?.nome ?? "—";
  const columns: Column<Modelo>[] = [
    { header: "ID", render: (modelo) => modelo.id },
    { header: "Modelo", render: (modelo) => modelo.nome },
    { header: "Ano", render: (modelo) => modelo.ano },
    { header: "Marca", render: (modelo) => nomeMarca(modelo.marcaId) },
    { header: "Categoria", render: (modelo) => nomeCategoria(modelo.categoriaId) },
  ];
  const filtrados = modelos.filter((modelo) => `${modelo.nome} ${modelo.ano} ${nomeMarca(modelo.marcaId)} ${nomeCategoria(modelo.categoriaId)}`.toLocaleLowerCase("pt-BR").includes(pesquisa.trim().toLocaleLowerCase("pt-BR")));

  return (
    <section className="container-xl py-5">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div><h2 className="mb-1">Modelos</h2><p className="text-body-secondary mb-0">Gerencie os modelos, marcas e categorias da sua frota.</p></div>
        <Button label="+ Novo modelo" disabled={carregando} onClick={() => setFormulario({ modelo: null })} />
      </div>
      {mensagem && <Alert {...mensagem} onClose={() => setMensagem(null)} />}
      <div className="border rounded-3 p-3 mb-4 bg-body-tertiary d-inline-flex flex-column"><span className="small text-body-secondary">Total de modelos cadastrados</span><strong className="fs-2 text-primary">{String(modelos.length).padStart(2, "0")}</strong></div>
      <Card title="Modelos cadastrados">
        <Input label="Pesquisar modelo" name="pesquisa" value={pesquisa} placeholder="Modelo, ano, marca ou categoria" onChange={(e) => setPesquisa(e.target.value)} />
        {carregando ? <p role="status">Carregando modelos...</p> : <Table columns={columns} data={filtrados} onEdit={(modelo) => setFormulario({ modelo })} onDelete={setSelecionado} />}
        {!carregando && <p className="small text-body-secondary mb-0">Exibindo {filtrados.length} de {modelos.length} registros.</p>}
      </Card>
      {formulario && (
        <ModeloForm
          modelo={formulario.modelo}
          marcas={marcas}
          categorias={categorias}
          onClose={() => setFormulario(null)}
          onSaved={(salva, editando) => {
            setModelos((anteriores) => editando
              ? anteriores.map((modelo) => modelo.id === salva.id ? salva : modelo)
              : [...anteriores, salva]);
            setFormulario(null);
            setMensagem({ type: "success", message: editando ? "Modelo atualizado com sucesso!" : "Modelo cadastrado com sucesso!" });
          }}
        />
      )}
      <Modal show={selecionado !== null} title="Excluir modelo" onClose={() => setSelecionado(null)} onConfirm={() => void excluir()} confirmLabel="Excluir">
        <p className="mb-0">Deseja excluir o modelo <strong>{selecionado?.nome}</strong>?</p>
      </Modal>
    </section>
  );
}
