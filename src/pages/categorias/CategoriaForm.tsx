import { useState, type SubmitEvent } from "react";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Alert } from "../../components/Alert";
import { Modal } from "../../components/Modal";
import { categoriaInicial, type Categoria } from "../../models/Categoria";
import { categoriaService } from "../../service/categoriaService";

interface CategoriaFormProps {
  categoria: Categoria | null;
  onClose: () => void;
  onSaved: (categoria: Categoria, editando: boolean) => void;
}

export function CategoriaForm({ categoria, onClose, onSaved }: CategoriaFormProps) {
  const [dados, setDados] = useState<Categoria>({ ...(categoria ?? categoriaInicial) });
  const [erro, setErro] = useState("");
  const [erroNome, setErroNome] = useState("");
  const [valorDiaria, setValorDiaria] = useState(categoria ? String(categoria.valorLocacao) : "");
  const [erroValor, setErroValor] = useState("");
  const [salvando, setSalvando] = useState(false);
  const editando = Boolean(categoria?.id);

  async function salvar(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (salvando) return;
    const nome = dados.nome.trim();
    if (!nome) {
      setErroNome("Informe o nome da categoria.");
      return;
    }
    const valorLocacao = Number(valorDiaria);
    if (!valorDiaria.trim() || !Number.isFinite(valorLocacao) || valorLocacao <= 0 || Math.abs(valorLocacao * 100 - Math.round(valorLocacao * 100)) > 1e-7) {
      setErroValor("Informe uma diária maior que zero, com até duas casas decimais.");
      return;
    }
    setSalvando(true);
    setErro("");
    try {
      const salva = categoria?.id
        ? await categoriaService.atualizar(categoria.id, { ...dados, nome, valorLocacao })
        : await categoriaService.criar({ nome, valorLocacao });
      onSaved(salva, editando);
    } catch {
      setErro("Não foi possível salvar a categoria. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal show title={editando ? "Editar categoria" : "Nova categoria"} onClose={onClose}>
      <form onSubmit={salvar}>
        {erro && <Alert type="danger" message={erro} onClose={() => setErro("")} />}
        <Input
          label="Nome da categoria"
          name="nome"
          value={dados.nome}
          placeholder="Ex.: Econômico"
          required
          error={erroNome}
          disabled={salvando}
          onChange={(e) => {
            setDados({ ...dados, nome: e.target.value });
            setErroNome("");
          }}
        />
        <Input
          label="Valor da diária (R$)"
          name="valorLocacao"
          type="number"
          value={valorDiaria}
          min="0.01"
          step="0.01"
          required
          error={erroValor}
          disabled={salvando}
          onChange={(e) => { setValorDiaria(e.target.value); setErroValor(""); }}
        />
        <div className="d-flex justify-content-end gap-2 border-top pt-3 mt-3">
          <Button label="Cancelar" variant="secondary" disabled={salvando} onClick={onClose} />
          <Button label={salvando ? "Salvando..." : "Salvar categoria"} variant="primary" type="submit" disabled={salvando} />
        </div>
      </form>
    </Modal>
  );
}
