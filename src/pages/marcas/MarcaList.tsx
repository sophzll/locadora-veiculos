import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Table, type Column } from "../../components/Table";
import { Card } from "../../components/Card";
import { Alert } from "../../components/Alert";
import { Modal } from "../../components/Modal";
import type { Marca } from "../../models/Marca";
import { marcaService } from "../../service/marcaService";
import { modeloService } from "../../service/modeloService";

const columns: Column<Marca>[] = [
  { header: "ID", render: (marca) => marca.id },
  { header: "Fabricante", render: (marca) => marca.nome },
];

export function MarcaList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [pesquisa, setPesquisa] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [selecionada, setSelecionada] = useState<Marca | null>(null);
  const [mensagem, setMensagem] = useState<{ type: "success" | "danger" | "warning"; message: string } | null>(
    typeof location.state?.mensagem === "string" ? { type: "success", message: location.state.mensagem } : null
  );
  const excluindo = useRef(false);

  useEffect(() => {
    let ativo = true;
    marcaService.listar().then((dados) => {
      if (ativo) setMarcas(dados);
    }).catch(() => {
      if (ativo) setMensagem({ type: "danger", message: "Não foi possível carregar as marcas." });
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
      if (modelos.some((modelo) => modelo.marcaId === id)) {
        setMensagem({ type: "warning", message: "Esta marca possui modelos vinculados e não pode ser excluída." });
        return;
      }
      await marcaService.excluir(id);
      setMarcas((anteriores) => anteriores.filter((marca) => marca.id !== id));
      setMensagem({ type: "success", message: "Marca excluída com sucesso!" });
    } catch {
      setMensagem({ type: "danger", message: "Não foi possível excluir a marca." });
    } finally { excluindo.current = false; }
  }

  const filtradas = marcas.filter((marca) => marca.nome.toLocaleLowerCase("pt-BR").includes(pesquisa.trim().toLocaleLowerCase("pt-BR")));

  return (
    <section className="container-xl py-5">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div><h2 className="mb-1">Marcas</h2><p className="text-body-secondary mb-0">Gerencie os fabricantes da sua frota.</p></div>
        <Button label="+ Nova marca" onClick={() => navigate("/marcas/novo")} />
      </div>
      {mensagem && <Alert {...mensagem} onClose={() => setMensagem(null)} />}
      <div className="border rounded-3 p-3 mb-4 bg-body-tertiary d-inline-flex flex-column"><span className="small text-body-secondary">Total de marcas cadastradas</span><strong className="fs-2 text-primary">{String(marcas.length).padStart(2, "0")}</strong></div>
      <Card title="Fabricantes cadastrados">
        <Input label="Pesquisar marca" name="pesquisa" value={pesquisa} placeholder="Digite o nome do fabricante" onChange={(e) => setPesquisa(e.target.value)} />
        {carregando ? <p role="status">Carregando marcas...</p> : <Table columns={columns} data={filtradas} onEdit={(marca) => marca.id && navigate(`/marcas/${marca.id}/editar`)} onDelete={setSelecionada} />}
        {!carregando && <p className="small text-body-secondary mb-0">Exibindo {filtradas.length} de {marcas.length} registros.</p>}
      </Card>
      <Modal show={selecionada !== null} title="Excluir marca" onClose={() => setSelecionada(null)} onConfirm={() => void excluir()} confirmLabel="Excluir">
        <p className="mb-0">Deseja excluir a marca <strong>{selecionada?.nome}</strong>?</p>
      </Modal>
    </section>
  );
}

