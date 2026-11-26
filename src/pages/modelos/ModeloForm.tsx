import { mascaraAno } from "../../utils/mascaras";
import { useState, type SubmitEvent } from "react";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Select } from "../../components/Select";
import { Alert } from "../../components/Alert";
import { Modal } from "../../components/Modal";
import { modeloInicial, type Modelo } from "../../models/Modelo";
import type { Marca } from "../../models/Marca";
import type { Categoria } from "../../models/Categoria";
import { modeloService } from "../../service/modeloService";

interface ModeloFormProps {
  modelo: Modelo | null;
  marcas: Marca[];
  categorias: Categoria[];
  onClose: () => void;
  onSaved: (modelo: Modelo, editando: boolean) => void;
}

export function ModeloForm({ modelo, marcas, categorias, onClose, onSaved }: ModeloFormProps) {
  const [dados, setDados] = useState<Modelo>({ ...(modelo ?? modeloInicial) });
  const [ano, setAno] = useState(String(dados.ano));
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const editando = Boolean(modelo?.id);
  const opcoesMarcas = marcas.flatMap((marca) => marca.id ? [{ value: marca.id, label: marca.nome }] : []);
  const opcoesCategorias = categorias.flatMap((categoria) => categoria.id ? [{ value: categoria.id, label: categoria.nome }] : []);
  const semOpcoes = !opcoesMarcas.length || !opcoesCategorias.length;

  async function salvar(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (salvando) return;
    const nome = dados.nome.trim();
    const anoNumerico = Number(ano);
    if (!nome || ano.length !== 4 || !Number.isInteger(anoNumerico) || anoNumerico < 1886 || anoNumerico > 9999) {
      setErro("Informe o nome e um ano válido do modelo (1886 a 9999).");
      return;
    }
    if (!opcoesMarcas.some((opcao) => opcao.value === dados.marcaId) || !opcoesCategorias.some((opcao) => opcao.value === dados.categoriaId)) {
      setErro("Selecione uma marca e uma categoria válidas.");
      return;
    }
    setSalvando(true);
    setErro("");
    try {
      const payload: Modelo = { nome, ano: anoNumerico, marcaId: dados.marcaId, categoriaId: dados.categoriaId };
      const salvo = modelo?.id
        ? await modeloService.atualizar(modelo.id, { ...payload, id: modelo.id })
        : await modeloService.criar(payload);
      onSaved(salvo, editando);
    } catch {
      setErro("Não foi possível salvar o modelo. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal show title={editando ? "Editar modelo" : "Novo modelo"} onClose={onClose}>
      <form onSubmit={salvar}>
        {erro && <Alert type="danger" message={erro} onClose={() => setErro("")} />}
        {semOpcoes && <Alert type="warning" message="Cadastre ao menos uma marca e uma categoria antes de salvar um modelo." />}
        <Input label="Nome do modelo" name="nome" value={dados.nome} placeholder="Ex.: Uno" required disabled={salvando} onChange={(e) => setDados({ ...dados, nome: e.target.value })} />
        <Input label="Ano do modelo" name="ano" type="text" value={ano} maxLength={4} inputMode="numeric" required disabled={salvando} onChange={(e) => setAno(mascaraAno(e.target.value))} />
        <Select label="Marca" name="marcaId" value={dados.marcaId} options={opcoesMarcas} required disabled={salvando} onChange={(e) => setDados({ ...dados, marcaId: e.target.value })} />
        <Select label="Categoria" name="categoriaId" value={dados.categoriaId} options={opcoesCategorias} required disabled={salvando} onChange={(e) => setDados({ ...dados, categoriaId: e.target.value })} />
        <div className="d-flex justify-content-end gap-2 border-top pt-3 mt-3">
          <Button label="Cancelar" variant="secondary" disabled={salvando} onClick={onClose} />
          <Button label={salvando ? "Salvando..." : "Salvar modelo"} variant="primary" type="submit" disabled={salvando || semOpcoes} />
        </div>
      </form>
    </Modal>
  );
}
