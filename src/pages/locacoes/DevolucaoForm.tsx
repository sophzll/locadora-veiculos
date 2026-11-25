import { useEffect, useRef, useState, type SubmitEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Alert } from "../../components/Alert";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Input } from "../../components/Input";
import { Select } from "../../components/Select";
import { TextArea } from "../../components/TextArea";

import { calcularDiarias, type Locacao } from "../../models/Locacao";
import type { NivelCombustivel } from "../../models/Vistoria";
import { locacaoService } from "../../service/locacaoService";
import { veiculoService } from "../../service/veiculoService";
import { vistoriaService } from "../../service/vistoriaService";

const moeda = (valor: number) => valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
});

// Preserva a diária contratada, mesmo que a categoria tenha mudado de preço.
function diariaContratada(locacao: Locacao) {
    const dias = calcularDiarias(locacao.dataRetirada, locacao.dataDevolucaoPrevista);
    return dias > 0 ? Math.round(locacao.valorTotal / dias * 100) / 100 : 0;
}

function agoraLocal() {
    const data = new Date();
    return new Date(data.getTime() - data.getTimezoneOffset() * 60000)
        .toISOString().slice(0, 16);
}

export function DevolucaoForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [locacao, setLocacao] = useState<Locacao | null>(null);
    const [placa, setPlaca] = useState("");
    const [dataReal, setDataReal] = useState(agoraLocal);
    const [km, setKm] = useState("");
    const [combustivel, setCombustivel] = useState<NivelCombustivel>("CHEIO");
    const [observacoes, setObservacoes] = useState("");
    const [erro, setErro] = useState("");
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [bloqueado, setBloqueado] = useState(false);
    const envio = useRef(false);

    useEffect(() => {
        let ativo = true;
        async function carregar() {
            try {
                if (!id) throw new Error("Locação não encontrada.");
                const registro = await locacaoService.buscarPorId(id);
                const veiculo = await veiculoService.buscarPorId(String(registro.veiculoId));
                if (!ativo) return;
                setLocacao(registro);
                setPlaca(veiculo.placa);
                setKm(String(Math.max(registro.kmRetirada, veiculo.kmRodado)));
            } catch {
                if (ativo) setErro("Não foi possível carregar a locação.");
            } finally {
                if (ativo) setCarregando(false);
            }
        }
        void carregar();
        return () => { ativo = false; };
    }, [id]);

    const diaria = locacao ? diariaContratada(locacao) : 0;
    const dias = locacao ? calcularDiarias(locacao.dataRetirada, dataReal) : 0;
    const total = Math.round(diaria * dias * 100) / 100;

    async function salvar(e: SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!id || envio.current || bloqueado) return;
        envio.current = true;
        setSalvando(true);
        setErro("");

        try {
            const atual = await locacaoService.buscarPorId(id);
            const [veiculo, vistorias] = await Promise.all([
                veiculoService.buscarPorId(String(atual.veiculoId)),
                vistoriaService.listar()
            ]);
            if (atual.status !== "ABERTA") {
                throw new Error("Somente locações abertas podem ser finalizadas.");
            }
            if (vistorias.some(v => String(v.locacaoId) === id && v.tipo === "DEVOLUCAO")) {
                throw new Error("Já existe uma vistoria de devolução. Confira os registros antes de continuar.");
            }
            const diasReais = calcularDiarias(atual.dataRetirada, dataReal);
            if (!diasReais || new Date(dataReal).getTime() > Date.now()) {
                throw new Error("A devolução deve ser posterior à retirada e não pode estar no futuro.");
            }
            const kmFinal = Number(km);
            if (!km.trim() || !Number.isSafeInteger(kmFinal) || kmFinal < Math.max(atual.kmRetirada, veiculo.kmRodado)) {
                throw new Error("A quilometragem não pode ser inferior à de retirada ou à atual do veículo.");
            }
            const taxa = diariaContratada(atual);
            if (!Number.isFinite(taxa) || taxa <= 0) {
                throw new Error("Não foi possível recuperar o valor da diária contratada.");
            }
            // JSON Server não possui transações. Em caso de falha, tenta restaurar os dados.
            try {
                await vistoriaService.criar({
                    locacaoId: id,
                    tipo: "DEVOLUCAO",
                    data: dataReal,
                    km: kmFinal,
                    nivelCombustivel: combustivel,
                    observacoes: observacoes.trim()
                });
                await veiculoService.atualizar(String(atual.veiculoId), {
                    ...veiculo,
                    kmRodado: kmFinal
                });
                await locacaoService.atualizar(id, {
                    ...atual,
                    dataDevolucaoReal: dataReal,
                    kmDevolucao: kmFinal,
                    valorTotal: Math.round(taxa * diasReais * 100) / 100,
                    status: "FINALIZADA"
                });
            } catch {
                try {
                    await locacaoService.atualizar(id, atual);
                    await veiculoService.atualizar(String(atual.veiculoId), veiculo);
                    const registros = await vistoriaService.listar();
                    for (const v of registros.filter(v => String(v.locacaoId) === id && v.tipo === "DEVOLUCAO")) {
                        if (v.id) await vistoriaService.excluir(String(v.id));
                    }
                } catch {
                    setBloqueado(true);
                    throw new Error("Falha ao restaurar os dados. Confira o JSON Server antes de tentar novamente.");
                }
                throw new Error("Não foi possível finalizar a locação. As alterações foram desfeitas.");
            }
            navigate("/locacoes", { state: { sucesso: "Locação finalizada com sucesso!" } });
        } catch (e) {
            setErro(e instanceof Error ? e.message : "Não foi possível registrar a devolução.");
        } finally {
            envio.current = false;
            setSalvando(false);
        }
    }

    return (
        <section className="container-xl py-5">
            <h2>Devolução de veículo</h2>
            <p className="text-body-secondary">Registre a vistoria e finalize a locação.</p>

            {erro && <Alert type="danger" message={erro} onClose={() => setErro("")} />}
            {carregando && <p>Carregando...</p>}
            {!carregando && locacao && locacao.status !== "ABERTA" && (
                <Alert type="warning" message="Esta locação não está aberta." />
            )}

            {locacao?.status === "ABERTA" && (
                <form onSubmit={salvar}>
                    <Card title="Informações da locação">
                        <div className="row g-3">
                            <div className="col-md-4">Placa: <strong>{placa}</strong></div>
                            <div className="col-md-4">Km de retirada: <strong>{locacao.kmRetirada}</strong></div>
                            <div className="col-md-4">Valor previsto: <strong>{moeda(locacao.valorTotal)}</strong></div>
                        </div>
                        <p className="mt-3 mb-1">Retirada: {new Date(locacao.dataRetirada).toLocaleString("pt-BR")}</p>
                        <p className="mb-0">Devolução prevista: {new Date(locacao.dataDevolucaoPrevista).toLocaleString("pt-BR")}</p>
                    </Card>

                    <Card title="Vistoria de devolução">
                        <div className="row">
                            <div className="col-md-6">
                                <Input label="Data e hora da devolução" name="dataReal"
                                    type="datetime-local" value={dataReal} required disabled={salvando}
                                    onChange={e => setDataReal(e.target.value)} />
                            </div>
                            <div className="col-md-6">
                                <Input label="Quilometragem de devolução" name="km"
                                    type="number" min={locacao.kmRetirada} step={1} value={km}
                                    required disabled={salvando} onChange={e => setKm(e.target.value)} />
                            </div>
                        </div>
                        <Select label="Nível de combustível" name="combustivel" value={combustivel}
                            required disabled={salvando}
                            onChange={e => setCombustivel(e.target.value as NivelCombustivel)}
                            options={(["VAZIO", "1/4", "1/2", "3/4", "CHEIO"] as const).map(v => ({ value: v, label: v }))} />
                        <TextArea label="Observações" name="observacoes" value={observacoes}
                            disabled={salvando} onChange={e => setObservacoes(e.target.value)} />
                    </Card>

                    <Card title="Valor final">
                        <div className="row g-3">
                            <div className="col-md-4">Diária: <strong>{moeda(diaria)}</strong></div>
                            <div className="col-md-4">Diárias utilizadas: <strong>{dias}</strong></div>
                            <div className="col-md-4">Total final: <strong className="text-primary">{moeda(total)}</strong></div>
                        </div>
                    </Card>
                    <div className="d-flex flex-wrap justify-content-end gap-2">
                        <Button label="Cancelar" variant="secondary" disabled={salvando}
                            onClick={() => navigate(`/locacoes/${id}`)} />
                        <Button label={salvando ? "Finalizando..." : "Finalizar locação"}
                            type="submit" disabled={salvando || bloqueado || !dias || diaria <= 0} />
                    </div>
                </form>
            )}
            {!carregando && locacao?.status !== "ABERTA" && (
                <Button label="Voltar" variant="secondary" onClick={() => navigate("/locacoes")} />
            )}
        </section>
    );
}
