import { useEffect, useRef, useState, type SubmitEvent } from "react";

import { useNavigate } from "react-router-dom";

import { Button } from "../../components/Button";

import { Input } from "../../components/Input";

import { Select } from "../../components/Select";

import { TextArea } from "../../components/TextArea";

import { Card } from "../../components/Card";

import { Alert } from "../../components/Alert";

import { locacaoInicial, calcularDiarias, calcularValorLocacao } from "../../models/Locacao";

import type { NivelCombustivel } from "../../models/Vistoria";

import { clienteService } from "../../service/clienteService";

import { veiculoService } from "../../service/veiculoService";

import { modeloService } from "../../service/modeloService";

import { marcaService } from "../../service/marcaService";

import { categoriaService } from "../../service/categoriaService";

import { manutencaoService } from "../../service/manutencaoService";

import { locacaoService } from "../../service/locacaoService";

import { contratoService } from "../../service/contratoService";

import { vistoriaService } from "../../service/vistoriaService";



async function carregarDados() {

  const [clientes, veiculos, modelos, marcas, categorias, manutencoes, locacoes] = await Promise.all([

    clienteService.listar(), veiculoService.listar(), modeloService.listar(), marcaService.listar(), categoriaService.listar(), manutencaoService.listar(), locacaoService.listar(),

  ]);

  return { clientes, veiculos, modelos, marcas, categorias, manutencoes, locacoes };

}

type Dados = Awaited<ReturnType<typeof carregarDados>>;

const moeda = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const hoje = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };

function disponivel(d: Dados, id: string) {

  return !d.locacoes.some(l => String(l.veiculoId) === String(id) && l.status === "ABERTA") && !d.manutencoes.some(m => String(m.veiculoId) === String(id) && m.status === "EM_ANDAMENTO");

}

function diaria(d: Dados, id: string) {

  const v = d.veiculos.find(v => String(v.id) === String(id));

  const m = d.modelos.find(m => String(m.id) === String(v?.modeloId));

  return d.categorias.find(c => String(c.id) === String(m?.categoriaId))?.valorLocacao;

}

export function LocacaoForm() {

  const navigate = useNavigate();

  const [base, setBase] = useState<Dados | null>(null);

  const [dados, setDados] = useState({ ...locacaoInicial });

  const [km, setKm] = useState("");

  const [combustivel, setCombustivel] = useState<NivelCombustivel>("CHEIO");

  const [observacoes, setObservacoes] = useState("");

  const [erro, setErro] = useState("");

  const [salvando, setSalvando] = useState(false);

  const bloqueio = useRef(false);

  useEffect(() => { let ativo = true; carregarDados().then(d => { if (ativo) setBase(d); }).catch(() => { if (ativo) setErro("Não foi possível carregar os dados da locação."); }); return () => { ativo = false; }; }, []);

  const valorDiaria = base ? diaria(base, dados.veiculoId) ?? 0 : 0;

  const dias = calcularDiarias(dados.dataRetirada, dados.dataDevolucaoPrevista);

  const total = calcularValorLocacao(dados.dataRetirada, dados.dataDevolucaoPrevista, valorDiaria);

  async function salvar(e: SubmitEvent<HTMLFormElement>) {

    e.preventDefault(); if (bloqueio.current) return;

    bloqueio.current = true; setSalvando(true); setErro("");

    let locacaoId: string | undefined;

    try {

      const atual = await carregarDados(); setBase(atual);

      const cliente = atual.clientes.find(c => String(c.id) === String(dados.clienteId));

      const veiculo = atual.veiculos.find(v => String(v.id) === String(dados.veiculoId));

      const valor = diaria(atual, dados.veiculoId);

      if (!cliente || !veiculo) throw new Error("Selecione um cliente e um veículo válidos.");

      if (!cliente.validadeCnh || cliente.validadeCnh < hoje() || cliente.validadeCnh < dados.dataRetirada.slice(0,10)) throw new Error("O cliente possui CNH vencida na data de hoje ou de retirada.");

      if (!disponivel(atual, dados.veiculoId)) throw new Error("Este veículo não está disponível para locação.");

      if (!dias) throw new Error("A devolução prevista deve ser posterior à retirada.");

      if (valor === undefined || !Number.isFinite(valor) || valor <= 0) throw new Error("Categoria sem valor de diária válido.");

      if (!km.trim() || !Number.isInteger(Number(km)) || Number(km) < veiculo.kmRodado) throw new Error("Informe uma quilometragem inteira igual ou superior à atual do veículo.");

      const salvo = await locacaoService.criar({ ...dados, kmRetirada: Number(km), valorTotal: Math.round(calcularValorLocacao(dados.dataRetirada, dados.dataDevolucaoPrevista, valor)*100)/100 });

      if (salvo.id == null) {
      throw new Error("A API não retornou o ID da locação.");
    }
    locacaoId = String(salvo.id);

      const contrato = await contratoService.criar({ locacaoId, numero: `CTR-${crypto.randomUUID()}`, dataEmissao: hoje(), termos: `Locação do veículo ${veiculo.placa} para ${cliente.nome}. Diária: ${moeda(valor)}. Retirada: ${dados.dataRetirada}. Devolução prevista: ${dados.dataDevolucaoPrevista}. Valor previsto: ${moeda(salvo.valorTotal)}.` });

      if (contrato.id == null) {
      throw new Error("A API não retornou o ID do contrato.");
    }

      await vistoriaService.criar({ locacaoId, tipo: "RETIRADA", data: dados.dataRetirada, km: Number(km), nivelCombustivel: combustivel, observacoes: observacoes.trim() });

      navigate("/locacoes", { state: { sucesso: "Locação registrada com contrato e vistoria de retirada!" } });

    } catch (e) {

      if (locacaoId) {

        try {

          const vistorias = await vistoriaService.listar();

          for (const v of vistorias.filter(v => String(v.locacaoId) === String(locacaoId))) { if (v.id) await vistoriaService.excluir(String(v.id)); }

          const contratos = await contratoService.listar();

          for (const c of contratos.filter(c => String(c.locacaoId) === String(locacaoId))) { if (c.id) await contratoService.excluir(String(c.id)); }

          await locacaoService.excluir(locacaoId);

        } catch { setErro("Falha ao desfazer a locação incompleta. Confira os registros no JSON Server antes de tentar novamente."); return; }

      }

      setErro(e instanceof Error ? e.message : "Não foi possível registrar a locação.");

    } finally { bloqueio.current = false; setSalvando(false); }

  }

  return <section className="container-xl py-5">

    {erro && <Alert type="danger" message={erro} onClose={() => setErro("")} />}

    {!base ? <p>Dados da locação indisponíveis ou carregando.</p> : <form onSubmit={salvar}>

      <Card title="Cliente e veículo"><div className="row"><div className="col-md-6"><Select name="clienteId" label="Cliente" required disabled={salvando} value={dados.clienteId} onChange={e => setDados(d => ({...d, clienteId:e.target.value}))} options={base.clientes.flatMap(c => c.id ? [{value:String(c.id),label:`${c.nome}${c.validadeCnh < hoje() ? " — CNH vencida" : ""}`}] : [])} /></div>

      <div className="col-md-6">
         <Select
            name="veiculoId"
            label="Veículo disponível"
            required
            disabled={salvando}
            value={dados.veiculoId}
            onChange={e => {
                const id = e.target.value;
                setDados(d => ({ ...d, veiculoId: id }));
                setKm(String(base.veiculos.find(v => String(v.id) === id)?.kmRodado ?? ""));
            }}
            options={base.veiculos.flatMap(v => {
                if (!v.id || !disponivel(base, String(v.id))) return [];

                const modelo = base.modelos.find(
                    m => String(m.id) === String(v.modeloId)
                );

                return [{
                    value: String(v.id),
                    label: `${v.placa} · ${modelo?.nome ?? "Modelo não identificado"}`
                }];
            })}
        />
      </div></div></Card>

      <Card title="Período e valor"><div className="row"><div className="col-md-6"><Input label="Data de retirada" name="dataRetirada" type="datetime-local" required disabled={salvando} value={dados.dataRetirada} onChange={e=>setDados(d=>({...d,dataRetirada:e.target.value}))}/></div><div className="col-md-6"><Input label="Devolução prevista" name="dataDevolucaoPrevista" type="datetime-local" required disabled={salvando} value={dados.dataDevolucaoPrevista} onChange={e=>setDados(d=>({...d,dataDevolucaoPrevista:e.target.value}))}/></div></div><div className="row g-3"><div className="col-md-4">Diária: <strong>{moeda(valorDiaria)}</strong></div><div className="col-md-4">Diárias: <strong>{dias}</strong></div><div className="col-md-4">Total previsto: <strong className="text-primary">{moeda(total)}</strong></div></div></Card>

      <Card title="Vistoria de retirada"><div className="row"><div className="col-md-6"><Input label="Quilometragem de retirada" name="km" type="number" min={0} step={1} required disabled={salvando} value={km} onChange={e=>setKm(e.target.value)}/></div><div className="col-md-6"><Select label="Nível de combustível" name="combustivel" required disabled={salvando} value={combustivel} onChange={e=>setCombustivel(e.target.value as NivelCombustivel)} options={(["VAZIO","1/4","1/2","3/4","CHEIO"] as const).map(v=>({value:v,label:v}))}/></div></div><TextArea label="Observações" name="observacoes" value={observacoes} disabled={salvando} onChange={e=>setObservacoes(e.target.value)}/></Card>

      <div className="d-flex justify-content-end gap-2"><Button label="Cancelar" variant="secondary" disabled={salvando} onClick={()=>navigate("/locacoes")}/><Button label={salvando?"Salvando...":"Registrar locação"} type="submit" disabled={salvando}/></div>

    </form>}

  </section>;

}
