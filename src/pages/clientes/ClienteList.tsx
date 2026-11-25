import { useEffect, useRef, useState } from "react";
import { ClienteForm } from "./ClienteForm";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Table, type Column } from "../../components/Table";
import { Card } from "../../components/Card";
import { Alert } from "../../components/Alert";
import { Modal } from "../../components/Modal";
import type { Cliente } from "../../models/Cliente";
import { clienteService } from "../../service/clienteService";
import { locacaoService } from "../../service/locacaoService";

function cnhVencida(cliente: Cliente) {
  const agora = new Date();
  const hoje = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}-${String(agora.getDate()).padStart(2, "0")}`;
  return cliente.validadeCnh < hoje;
}

export function ClienteList() {
  const [registros, setRegistros] = useState<Cliente[]>([]);
  const [formulario, setFormulario] = useState<{ cliente: Cliente | null } | null>(null);
  const [selecionado, setSelecionado] = useState<Cliente | null>(null);
  const [pesquisa, setPesquisa] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [falha, setFalha] = useState(false);
  const [mensagem, setMensagem] = useState<{ type: "success" | "danger" | "warning"; message: string } | null>(null);
  const excluindo = useRef(false);

  useEffect(() => {
    let ativo = true;
    clienteService.listar()
      .then(r => { if (ativo) setRegistros(r); })
      .catch(() => { if (ativo) { setFalha(true); setMensagem({ type: "danger", message: "Não foi possível carregar os clientes." }); } })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, []);

  const termo = pesquisa.trim().toLocaleLowerCase("pt-BR");
  const numeros = termo.replace(/\D/g, "");
  const filtrados = registros.filter(c =>
    `${c.nome} ${c.cpf} ${c.cnh} ${c.telefone} ${c.email}`.toLocaleLowerCase("pt-BR").includes(termo) ||
    (/^[\d\s().-]+$/.test(termo) && !!numeros && [c.cpf, c.cnh, c.telefone].some(v => v.replace(/\D/g, "").includes(numeros)))
  );
  const columns: Column<Cliente>[] = [
    { header: "Nome", render: c => c.nome },
    { header: "CPF", render: c => c.cpf },
    { header: "CNH", render: c => c.cnh },
    { header: "Validade", render: c => c.validadeCnh.split("-").reverse().join("/") },
    { header: "Situação da CNH", render: c => <span className={`badge ${cnhVencida(c) ? "text-bg-warning" : "text-bg-success"}`}>{cnhVencida(c) ? "Vencida" : "Válida"}</span> },
    { header: "Telefone", render: c => c.telefone },
    { header: "E-mail", render: c => c.email },
    { header: "Endereço", render: c => c.endereco },
  ];

  async function excluir() {
    if (!selecionado?.id || excluindo.current) return;
    const id = selecionado.id;
    excluindo.current = true; setSelecionado(null);
    try {
      const locacoes = await locacaoService.listar();
      if (locacoes.some(l => l.clienteId === id)) {
        setMensagem({ type: "warning", message: "Este cliente possui locações vinculadas e não pode ser excluído." }); return;
      }
      await clienteService.excluir(id);
      setRegistros(old => old.filter(c => c.id !== id));
      setMensagem({ type: "success", message: "Cliente excluído com sucesso!" });
    } catch { setMensagem({ type: "danger", message: "Não foi possível excluir o cliente." }); }
    finally { excluindo.current = false; }
  }

  return (
    <section className="container-xl py-5">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div><h2 className="mb-1">Clientes</h2><p className="text-body-secondary mb-0">Gerencie os clientes e suas informações de habilitação.</p></div>
        <Button label="+ Novo cliente" disabled={carregando || falha} onClick={() => setFormulario({ cliente: null })} />
      </div>
      {mensagem && <Alert {...mensagem} onClose={() => setMensagem(null)} />}
      <div className="border rounded-3 p-3 mb-4 bg-body-tertiary d-inline-flex flex-column"><span className="small text-body-secondary">Total de clientes cadastrados</span><strong className="fs-2 text-primary">{carregando || falha ? "—" : String(registros.length).padStart(2, "0")}</strong></div>
      <Card title="Clientes cadastrados">
        <Input label="Pesquisar cliente" name="pesquisa" value={pesquisa} placeholder="Nome, CPF, CNH, telefone ou e-mail" onChange={e => setPesquisa(e.target.value)} />
        {carregando ? <p role="status">Carregando clientes...</p> : !falha && <Table columns={columns} data={filtrados} onEdit={cliente => setFormulario({ cliente })} onDelete={setSelecionado} />}
        {!carregando && !falha && <p className="small text-body-secondary mb-0">Exibindo {filtrados.length} de {registros.length} registros.</p>}
      </Card>
      {formulario && <ClienteForm cliente={formulario.cliente} onClose={() => setFormulario(null)} onSaved={(salvo, editando) => {
        setRegistros(old => editando ? old.map(c => c.id === salvo.id ? salvo : c) : [...old, salvo]);
        setFormulario(null); setMensagem({ type: "success", message: editando ? "Cliente atualizado com sucesso!" : "Cliente cadastrado com sucesso!" });
      }} />}
      <Modal show={selecionado !== null} title="Excluir cliente" onClose={() => setSelecionado(null)} onConfirm={() => void excluir()} confirmLabel="Excluir"><p className="mb-0">Deseja excluir o cliente {selecionado?.nome}?</p></Modal>
    </section>
  );
}
