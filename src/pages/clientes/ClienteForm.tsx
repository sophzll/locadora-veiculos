import { mascaraCPF, mascaraCNH, mascaraTelefone } from "../../utils/mascaras";
import { useState, type SubmitEvent } from "react";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Modal } from "../../components/Modal";
import { Alert } from "../../components/Alert";
import { clienteInicial, type Cliente } from "../../models/Cliente";
import { clienteService } from "../../service/clienteService";

interface ClienteFormProps {
  cliente: Cliente | null;
  onClose: () => void;
  onSaved: (salvo: Cliente, editando: boolean) => void;
}

const digitos = (valor: string) => valor.replace(/\D/g, "");

export function ClienteForm({ cliente, onClose, onSaved }: ClienteFormProps) {
  const [dados, setDados] = useState<Cliente>({ ...clienteInicial, ...cliente, cpf: mascaraCPF(cliente?.cpf ?? ""), cnh: mascaraCNH(cliente?.cnh ?? ""), telefone: mascaraTelefone(cliente?.telefone ?? "") });
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const editando = Boolean(cliente?.id);

  function alterar(campo: keyof Omit<Cliente, "id">, valor: string) {
    setDados(anterior => ({ ...anterior, [campo]: valor }));
  }

  async function salvar(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (salvando) return;
    const cpf = digitos(dados.cpf);
    const cnh = digitos(dados.cnh);
    if (![dados.nome, dados.validadeCnh, dados.telefone, dados.email, dados.endereco].every(v => v.trim())) {
      setErro("Preencha todos os campos obrigatórios."); return;
    }
    if (cpf.length !== 11 || cnh.length !== 11) {
      setErro("CPF e CNH devem conter 11 dígitos."); return;
    }
    if (![10, 11].includes(digitos(dados.telefone).length)) {
      setErro("Informe um telefone com DDD e 10 ou 11 dígitos."); return;
    }
    setSalvando(true); setErro("");
    try {
      const existentes = await clienteService.listar();
      if (existentes.some(c => c.id !== cliente?.id && digitos(c.cpf) === cpf)) {
        setErro("Este CPF já está cadastrado."); return;
      }
      if (existentes.some(c => c.id !== cliente?.id && digitos(c.cnh) === cnh)) {
        setErro("Esta CNH já está cadastrada."); return;
      }
      const payload: Cliente = {
        ...dados, nome: dados.nome.trim(), cpf: mascaraCPF(cpf), cnh,
        telefone: mascaraTelefone(dados.telefone), email: dados.email.trim(), endereco: dados.endereco.trim(),
      };
      const salvo = cliente?.id ? await clienteService.atualizar(cliente.id, payload) : await clienteService.criar(payload);
      onSaved(salvo, editando);
    } catch { setErro("Não foi possível salvar o cliente."); }
    finally { setSalvando(false); }
  }

  return (
    <Modal show title={editando ? "Editar cliente" : "Novo cliente"} onClose={() => { if (!salvando) onClose(); }}>
      <form onSubmit={salvar}>
        {erro && <Alert type="danger" message={erro} onClose={() => setErro("")} />}
        <Input label="Nome completo" name="nome" value={dados.nome} required disabled={salvando} onChange={e => alterar("nome", e.target.value)} />
        <div className="row">
          <div className="col-md-6"><Input label="CPF" name="cpf" value={dados.cpf} maxLength={14} inputMode="numeric" required disabled={salvando} onChange={e => alterar("cpf", mascaraCPF(e.target.value))} /></div>
          <div className="col-md-6"><Input label="CNH" name="cnh" value={dados.cnh} maxLength={11} inputMode="numeric" placeholder="11 dígitos" required disabled={salvando} onChange={e => alterar("cnh", mascaraCNH(e.target.value))} /></div>
          <div className="col-md-6"><Input label="Validade da CNH" name="validadeCnh" type="date" value={dados.validadeCnh} required disabled={salvando} onChange={e => alterar("validadeCnh", e.target.value)} /></div>
          <div className="col-md-6"><Input label="Telefone" name="telefone" type="tel" value={dados.telefone} maxLength={15} inputMode="tel" required disabled={salvando} onChange={e => alterar("telefone", mascaraTelefone(e.target.value))} /></div>
        </div>
        <Input label="E-mail" name="email" type="email" value={dados.email} required disabled={salvando} onChange={e => alterar("email", e.target.value)} />
        <Input label="Endereço" name="endereco" value={dados.endereco} required disabled={salvando} onChange={e => alterar("endereco", e.target.value)} />
        <div className="d-flex justify-content-end gap-2 border-top pt-3 mt-3">
          <Button label="Cancelar" variant="secondary" disabled={salvando} onClick={onClose} />
          <Button label={salvando ? "Salvando..." : "Salvar cliente"} type="submit" disabled={salvando} />
        </div>
      </form>
    </Modal>
  );
}
