import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Card } from "../../components/Card";
import { Alert } from "../../components/Alert";
import { marcaInicial, type Marca } from "../../models/Marca";
import { marcaService } from "../../service/marcaService";

export function MarcaForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [marca, setMarca] = useState<Marca>({ ...marcaInicial });
  const [erro, setErro] = useState("");
  const [erroNome, setErroNome] = useState("");
  const [carregando, setCarregando] = useState(Boolean(id));
  const [falhaCarga, setFalhaCarga] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let ativo = true;
    if (!id) { setMarca({ ...marcaInicial }); setCarregando(false); setFalhaCarga(false); return; }
    setCarregando(true);
    setFalhaCarga(false);
    marcaService.buscarPorId(id).then((dados) => { if (ativo) setMarca(dados); }).catch(() => {
      if (ativo) { setErro("Não foi possível carregar a marca."); setFalhaCarga(true); }
    }).finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [id]);

  async function salvar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (salvando || carregando || falhaCarga) return;
    const nome = marca.nome.trim();
    if (!nome) { setErroNome("Informe o nome da marca."); return; }
    setSalvando(true);
    setErro("");
    try {
      if (id) await marcaService.atualizar(id, { ...marca, nome });
      else await marcaService.criar({ nome });
      navigate("/marcas", { replace: true, state: { mensagem: id ? "Marca atualizada com sucesso!" : "Marca cadastrada com sucesso!" } });
    } catch { setErro("Não foi possível salvar a marca. Tente novamente."); }
    finally { setSalvando(false); }
  }

  return (
    <section className="container-xl py-5">
      <p className="small text-body-secondary mb-3">Home / Frota / Marcas / {id ? "Editar" : "Cadastrar"}</p>
      <h2 className="mb-4">{id ? "Editar marca" : "Nova marca"}</h2>
      {erro && <Alert type="danger" message={erro} onClose={() => setErro("")} />}
      <div className="col-12 col-lg-8 mx-auto">
        <Card title="Dados do fabricante">
          {carregando ? <p role="status">Carregando...</p> : <form onSubmit={salvar}>
            <Input label="Nome da marca" name="nome" value={marca.nome} placeholder="Ex.: Chevrolet" required error={erroNome} disabled={salvando || falhaCarga} onChange={(e) => { setMarca({ ...marca, nome: e.target.value }); setErroNome(""); }} />
            <div className="d-flex flex-wrap gap-2 mt-4">
              <Button label={salvando ? "Salvando..." : "Salvar marca"} type="submit" disabled={salvando || falhaCarga} />
              <Button label="Cancelar" variant="secondary" disabled={salvando} onClick={() => navigate("/marcas")} />
            </div>
          </form>}
        </Card>
      </div>
    </section>
  );
}
