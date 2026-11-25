import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Alert } from "../../components/Alert";
import { NotaFiscal } from "./NotaFiscal";
import { Table, type Column } from "../../components/Table";
import type { Pagamento } from "../../models/Pagamento";
import { PagamentoForm, formasPagamento, statusPagamento } from "./PagamentoForm";

import { locacaoService } from "../../service/locacaoService";
import { clienteService } from "../../service/clienteService";
import { veiculoService } from "../../service/veiculoService";
import { contratoService } from "../../service/contratoService";
import { vistoriaService } from "../../service/vistoriaService";
import { pagamentoService } from "../../service/pagamentoService";
import { notaFiscalService } from "../../service/notaFiscalService";

async function carregar(id: string) {
    const l = await locacaoService.buscarPorId(id);
    const [cliente, veiculo, contratos, vistorias, pagamentos, notas] = await Promise.all([
        clienteService.buscarPorId(String(l.clienteId)),
        veiculoService.buscarPorId(String(l.veiculoId)),
        contratoService.listar(),
        vistoriaService.listar(),
        pagamentoService.listar(),
        notaFiscalService.listar()
    ]);
    return {
        l, cliente, veiculo,
        contrato: contratos.find(c => String(c.locacaoId) === id),
        vistorias: vistorias.filter(v => String(v.locacaoId) === id),
        pagamentos: pagamentos.filter(p => String(p.locacaoId) === id),
        nota: notas.find(n => String(n.locacaoId) === id)
    };
}

const moeda = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const data = (v: string) => new Date(v).toLocaleString("pt-BR");

export function LocacaoConsulta() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [dados, setDados] = useState<Awaited<ReturnType<typeof carregar>> | null>(null);
    const [erro, setErro] = useState("");
    const [mensagem, setMensagem] = useState("");
    const [modal, setModal] = useState(false);
    const [pagamento, setPagamento] = useState<Pagamento | null>(null);

    const totalPago = (dados?.pagamentos ?? []).reduce((total, p) =>
        total + (p.status === "PAGO" ? Math.round(p.valor * 100) : 0), 0) / 100;
    const saldo = (Math.round((dados?.l.valorTotal ?? 0) * 100) - Math.round(totalPago * 100)) / 100;

    // Situação financeira independente do status da locação.
    const situacaoFinanceira = saldo < 0
        ? { label: "PAGO A MAIS", classe: "text-bg-info" }
        : saldo === 0
            ? { label: "QUITADO", classe: "text-bg-success" }
            : totalPago === 0
                ? { label: "PENDENTE", classe: "text-bg-danger" }
                : { label: "PARCIALMENTE PAGO", classe: "text-bg-warning" };

    const colunas: Column<Pagamento>[] = [
        { header: "Data", render: p => data(p.data) },
        { header: "Valor", render: p => moeda(p.valor) },
        { header: "Forma", render: p => formasPagamento[p.forma] ?? p.forma },
        { header: "Status", render: p => (
            <span className={`badge ${p.status === "PAGO" ? "text-bg-success" : p.status === "PENDENTE" ? "text-bg-warning" : "text-bg-secondary"}`}>
                {statusPagamento[p.status] ?? p.status}
            </span>
        ) }
    ];

    function pagamentoSalvo(salvo: Pagamento, editando: boolean) {
        setDados(anterior => anterior ? {
            ...anterior,
            pagamentos: editando
                ? anterior.pagamentos.map(p => String(p.id) === String(salvo.id) ? salvo : p)
                : [...anterior.pagamentos, salvo]
        } : anterior);
        setModal(false);
        setMensagem(editando ? "Pagamento atualizado com sucesso!" : "Pagamento registrado com sucesso!");
    }

    useEffect(() => {
        let ativo = true;
        if (id) {
            carregar(id).then(d => {
                if (ativo) setDados(d);
            }).catch(() => {
                if (ativo) setErro("Não foi possível carregar os detalhes da locação.");
            });
        }
        return () => { ativo = false; };
    }, [id]);

    return (
        <section className="container-xl py-5">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                <h2>Consulta de locação</h2>
                <div className="d-flex flex-wrap gap-2">
                    <Button label="Voltar" variant="secondary" onClick={() => navigate("/locacoes")} />
                    {dados?.l.status === "ABERTA" && (
                        <Button label="Registrar devolução" onClick={() => navigate(`/locacoes/${id}/devolucao`)} />
                    )}
                </div>
            </div>
            {erro && <Alert type="danger" message={erro} onClose={() => setErro("")} />}
            {mensagem && <Alert type="success" message={mensagem} onClose={() => setMensagem("")} />}
            {!dados && !erro && <p>Carregando...</p>}
            {dados && (
                <>
                    <Card title="Cliente e veículo">
                        <p>Cliente: {dados.cliente.nome}</p>
                        <p>CPF: {dados.cliente.cpf}</p>
                        <p>Placa: {dados.veiculo.placa}</p>
                        <p>Status: <span className={`badge ${dados.l.status === "FINALIZADA" ? "text-bg-success" : dados.l.status === "ABERTA" ? "text-bg-primary" : "text-bg-secondary"}`}>{dados.l.status}</span></p>
                        <p>Situação financeira: <span className={`badge ${situacaoFinanceira.classe}`}>{situacaoFinanceira.label}</span></p>
                        <p>Retirada: {data(dados.l.dataRetirada)}</p>
                        <p>Devolução prevista: {data(dados.l.dataDevolucaoPrevista)}</p>
                        {dados.l.dataDevolucaoReal && <p>Devolução real: {data(dados.l.dataDevolucaoReal)}</p>}
                        <p>Km de retirada: {dados.l.kmRetirada}</p>
                        {dados.l.kmDevolucao !== undefined && <p>Km de devolução: {dados.l.kmDevolucao}</p>}
                        <p className="mb-0">{dados.l.status === "FINALIZADA" ? "Valor final" : "Valor previsto"}: {moeda(dados.l.valorTotal)}</p>
                    </Card>
                    <Card title="Contrato">
                        {dados.contrato ? (
                            <>
                                <p>Número: {dados.contrato.numero}</p>
                                <p>Emissão: {dados.contrato.dataEmissao}</p>
                                <p className="mb-0">{dados.contrato.termos}</p>
                            </>
                        ) : <p>Contrato não encontrado.</p>}
                    </Card>
                    <Card title="Vistorias">
                        {dados.vistorias.length ? dados.vistorias.map(v => (
                            <div key={v.id} className="border-bottom pb-2 mb-2">
                                <strong>{v.tipo === "RETIRADA" ? "Retirada" : "Devolução"}</strong>
                                <p className="mb-1">Data: {data(v.data)}</p>
                                <p className="mb-1">Quilometragem: {v.km} km | Combustível: {v.nivelCombustivel}</p>
                                <p className="mb-0">{v.observacoes}</p>
                            </div>
                        )) : <p>Nenhuma vistoria registrada.</p>}
                    </Card>
                    <Card title="Pagamentos">
                        <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                            <span className="text-body-secondary">Situação financeira:</span>
                            <span className={`badge ${situacaoFinanceira.classe}`}>
                                {situacaoFinanceira.label}
                            </span>
                        </div>
                        <div className="row g-3 mb-4">
                            <div className="col-md-4">
                                <span className="text-body-secondary">Valor da locação</span>
                                <strong className="d-block fs-5">{moeda(dados.l.valorTotal)}</strong>
                            </div>
                            <div className="col-md-4">
                                <span className="text-body-secondary">Total pago</span>
                                <strong className="d-block fs-5 text-success">{moeda(totalPago)}</strong>
                            </div>
                            <div className="col-md-4">
                                <span className="text-body-secondary">{saldo < 0 ? "Valor pago a mais" : "Saldo restante"}</span>
                                <strong className="d-block fs-5 text-primary">{moeda(Math.abs(saldo))}</strong>
                            </div>
                        </div>
                        <div className="d-flex justify-content-end mb-3">
                            <Button label="+ Registrar pagamento" disabled={dados.l.status === "CANCELADA"}
                                onClick={() => { setPagamento(null); setModal(true); }} />
                        </div>
                        {dados.pagamentos.length ? (
                            <Table columns={colunas} data={dados.pagamentos}
                                onEdit={p => { setPagamento(p); setModal(true); }} />
                        ) : <p className="mb-0">Nenhum pagamento registrado.</p>}
                    </Card>
                    {id && <NotaFiscal key={id} id={id} status={dados.l.status}
                        valorTotal={dados.l.valorTotal} nota={dados.nota}
                        onNota={nota => setDados(anterior => anterior ? { ...anterior, nota } : anterior)}
                        onSuccess={setMensagem} onError={setErro} />}
                </>
            )}
            {modal && id && <PagamentoForm locacaoId={id} pagamento={pagamento}
                onClose={() => setModal(false)} onSaved={pagamentoSalvo} />}
        </section>
    );
}
