import { useEffect, useRef, useState } from "react";
import { CategoriaForm } from "./CategoriaForm";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Table, type Column } from "../../components/Table";
import { Card } from "../../components/Card";
import { Alert } from "../../components/Alert";
import { Modal } from "../../components/Modal";
import type { Categoria } from "../../models/Categoria";
import { categoriaService } from "../../service/categoriaService";
import { modeloService } from "../../service/modeloService";

const columns: Column<Categoria>[] = [
  { header: "ID", render: (categoria) => categoria.id },
  { header: "Categoria", render: (categoria) => categoria.nome },
  { header: "Valor da diária", render: (categoria) => categoria.valorLocacao.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) },
];

export function CategoriaList() {
  const [formulario, setFormulario] = useState<{ categoria: Categoria | null } | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [pesquisa, setPesquisa] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [selecionada, setSelecionada] = useState<Categoria | null>(null);
  const [mensagem, setMensagem] = useState<{ type: "success" | "danger" | "warning"; message: string } | null>(
    null
  );
  const excluindo = useRef(false);

  useEffect(() => {
    let ativo = true;
    categoriaService.listar().then((dados) => {
      if (ativo) setCategorias(dados);
    }).catch(() => {
      if (ativo) setMensagem({ type: "danger", message: "Não foi possível carregar as categorias." });
    }).finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, []);

  async function excluir() {
    if (!selecionada?.id || excluindo.current) return;
    const id = selecionada.id;
    excluindo.current = true;
    setSelecionada(null);
    try {
      const modelos = await modeloService.listar();
      if (modelos.some((modelo) => modelo.categoriaId === id)) {
        setMensagem({ type: "warning", message: "Esta categoria possui modelos vinculados e não pode ser excluída." });
        return;
      }
      await categoriaService.excluir(id);
      setCategorias((anteriores) => anteriores.filter((categoria) => categoria.id !== id));
      setMensagem({ type: "success", message: "Categoria excluída com sucesso!" });
    } catch {
      setMensagem({ type: "danger", message: "Não foi possível excluir a categoria." });
    } finally { excluindo.current = false; }
  }

  const filtradas = categorias.filter((categoria) => categoria.nome.toLocaleLowerCase("pt-BR").includes(pesquisa.trim().toLocaleLowerCase("pt-BR")));

  return (
    <section className="container-xl py-5">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div><h2 className="mb-1">Categorias</h2><p className="text-body-secondary mb-0">Gerencie as categorias e os valores das diárias da sua frota.</p></div>
        <Button label="+ Nova categoria" disabled={carregando} onClick={() => setFormulario({ categoria: null })} />
      </div>
      {mensagem && <Alert {...mensagem} onClose={() => setMensagem(null)} />}
      <div className="border rounded-3 p-3 mb-4 bg-body-tertiary d-inline-flex flex-column"><span className="small text-body-secondary">Total de categorias cadastradas</span><strong className="fs-2 text-primary">{String(categorias.length).padStart(2, "0")}</strong></div>
      <Card title="Categorias cadastradas">
        <Input label="Pesquisar categoria" name="pesquisa" value={pesquisa} placeholder="Digite o nome da categoria" onChange={(e) => setPesquisa(e.target.value)} />
        {carregando ? <p role="status">Carregando categorias...</p> : <Table columns={columns} data={filtradas} onEdit={(categoria) => setFormulario({ categoria })} onDelete={setSelecionada} />}
        {!carregando && <p className="small text-body-secondary mb-0">Exibindo {filtradas.length} de {categorias.length} registros.</p>}
      </Card>
      {formulario && (
        <CategoriaForm
          categoria={formulario.categoria}
          onClose={() => setFormulario(null)}
          onSaved={(salva, editando) => {
            setCategorias((anteriores) => editando
              ? anteriores.map((categoria) => categoria.id === salva.id ? salva : categoria)
              : [...anteriores, salva]);
            setFormulario(null);
            setMensagem({ type: "success", message: editando ? "Categoria atualizada com sucesso!" : "Categoria cadastrada com sucesso!" });
          }}
        />
      )}
      <Modal show={selecionada !== null} title="Excluir categoria" onClose={() => setSelecionada(null)} onConfirm={() => void excluir()} confirmLabel="Excluir">
        <p className="mb-0">Deseja excluir a categoria <strong>{selecionada?.nome}</strong>?</p>
      </Modal>
    </section>
  );
}
