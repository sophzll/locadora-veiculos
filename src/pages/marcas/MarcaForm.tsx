import { useState, type FormEvent } from "react";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Alert } from "../../components/Alert";
import { Modal } from "../../components/Modal";
import { marcaInicial, type Marca } from "../../models/Marca";
import { marcaService } from "../../service/marcaService";

interface MarcaFormProps {
  marca: Marca | null;
  onClose: () => void;
  onSaved: (marca: Marca, editando: boolean) => void;
}

export function MarcaForm({ marca, onClose, onSaved }: MarcaFormProps) {
  const [dados, setDados] = useState<Marca>({ ...(marca ?? marcaInicial) });
  const [erro, setErro] = useState("");
  const [erroNome, setErroNome] = useState("");
  const [salvando, setSalvando] = useState(false);
  const editando = Boolean(marca?.id);

  async function salvar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (salvando) return;
    const nome = dados.nome.trim();
    if (!nome) {
      setErroNome("Informe o nome da marca.");
      return;
    }
    setSalvando(true);
    setErro("");
    try {
      const salva = marca?.id
        ? await marcaService.atualizar(marca.id, { ...dados, nome })
        : await marcaService.criar({ nome });
      onSaved(salva, editando);
    } catch {
      setErro("Não foi possível salvar a marca. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal show title={editando ? "Editar marca" : "Nova marca"} onClose={onClose}>
      <form onSubmit={salvar}>
        {erro && <Alert type="danger" message={erro} onClose={() => setErro("")} />}
        <Input
          label="Nome da marca"
          name="nome"
          value={dados.nome}
          placeholder="Ex.: Chevrolet"
          required
          error={erroNome}
          disabled={salvando}
          onChange={(e) => {
            setDados({ ...dados, nome: e.target.value });
            setErroNome("");
          }}
        />
        <div className="d-flex justify-content-end gap-2 border-top pt-3 mt-3">
          <Button label="Cancelar" variant="secondary" disabled={salvando} onClick={onClose} />
          <Button label={salvando ? "Salvando..." : "Salvar marca"} variant="primary" type="submit" disabled={salvando} />
        </div>
      </form>
    </Modal>
  );
}
