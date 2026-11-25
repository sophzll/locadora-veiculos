import { useRef, useState } from "react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import type { NotaFiscal as NotaFiscalModel } from "../../models/NotaFiscal";
import { locacaoService } from "../../service/locacaoService";
import { notaFiscalService } from "../../service/notaFiscalService";

interface NotaFiscalProps {
    id: string;
    status: string;
    valorTotal: number;
    nota?: NotaFiscalModel;
    onNota: (nota: NotaFiscalModel) => void;
    onSuccess: (mensagem: string) => void;
    onError: (mensagem: string) => void;
}

const moeda = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function NotaFiscal({ id, status, valorTotal, nota, onNota, onSuccess, onError }: NotaFiscalProps) {
    const [modalNota, setModalNota] = useState(false);
    const [emitindo, setEmitindo] = useState(false);
    const envioNota = useRef(false);

    async function emitirNota() {
        if (envioNota.current) return;
        envioNota.current = true;
        setEmitindo(true);
        onError("");
        try {
            const [locacao, notas] = await Promise.all([
                locacaoService.buscarPorId(id), notaFiscalService.listar()
            ]);
            if (locacao.status !== "FINALIZADA") {
                throw new Error("A nota fiscal só pode ser emitida para locações finalizadas.");
            }
            const existente = notas.find(n => String(n.locacaoId) === id);
            if (existente) {
                onNota(existente);
                setModalNota(false);
                throw new Error("Esta locação já possui uma nota fiscal.");
            }
            const hoje = new Date();
            const dataEmissao = new Date(hoje.getTime() - hoje.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
            const payload: NotaFiscalModel = {
                numero: `NF-${crypto.randomUUID()}`, serie: "1", dataEmissao,
                valor: locacao.valorTotal, locacaoId: id
            };
            const nota = await notaFiscalService.criar(payload);
            onNota(nota);
            setModalNota(false);
            onSuccess("Nota fiscal emitida com sucesso!");
        } catch (e) {
            setModalNota(false);
            onError(e instanceof Error ? e.message : "Não foi possível emitir a nota fiscal.");
        } finally {
            envioNota.current = false;
            setEmitindo(false);
        }
    }

    return (
        <>
            <Card title="Nota fiscal">
                {nota ? (
                    <>
                        <p>Número: {nota.numero}</p>
                        <p>Série: {nota.serie}</p>
                        <p>Emissão: {nota.dataEmissao.split("-").reverse().join("/")}</p>
                        <p className="mb-0">Valor: {moeda(nota.valor)}</p>
                    </>
                ) : (
                    <>
                        <p>Nota fiscal ainda não emitida.</p>
                        {status === "FINALIZADA" ? (
                            <Button label="Emitir nota fiscal" disabled={emitindo} onClick={() => setModalNota(true)} />
                        ) : <p className="mb-0 text-body-secondary">Disponível somente para locações finalizadas.</p>}
                    </>
                )}
            </Card>
            {modalNota && <Modal show title="Emitir nota fiscal"
                onClose={() => { if (!envioNota.current) setModalNota(false); }}>
                <p>Confirma a emissão da nota fiscal no valor de {moeda(valorTotal)}?</p>
                <p className="text-body-secondary">Será emitida apenas uma nota fiscal por locação.</p>
                <div className="d-flex justify-content-end gap-2 border-top pt-3 mt-3">
                    <Button label="Cancelar" variant="secondary" disabled={emitindo} onClick={() => setModalNota(false)} />
                    <Button label={emitindo ? "Emitindo..." : "Confirmar emissão"} disabled={emitindo} onClick={emitirNota} />
                </div>
            </Modal>}
        </>
    );
}
