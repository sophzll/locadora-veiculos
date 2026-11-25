import { useRef, useState, type SubmitEvent } from "react";
import { Alert } from "../../components/Alert";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Select } from "../../components/Select";
import { Modal } from "../../components/Modal";
import { pagamentoInicial, formasPagamento, statusPagamento, type Pagamento, type FormaPagamento, type StatusPagamento } from "../../models/Pagamento";
import { pagamentoService } from "../../service/pagamentoService";
import { locacaoService } from "../../service/locacaoService";

interface PagamentoFormProps {
    locacaoId: string;
    pagamento: Pagamento | null;
    onClose: () => void;
    onSaved: (salvo: Pagamento, editando: boolean) => void;
}

function agoraLocal() {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function PagamentoForm({ locacaoId, pagamento, onClose, onSaved }: PagamentoFormProps) {
    const [dados, setDados] = useState<Pagamento>({
        ...pagamentoInicial, data: agoraLocal(), ...pagamento, locacaoId
    });
    const [valor, setValor] = useState(pagamento ? String(pagamento.valor) : "");
    const [erro, setErro] = useState("");
    const [salvando, setSalvando] = useState(false);
    const envio = useRef(false);
    const editando = pagamento?.id != null;

    async function salvar(e: SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        if (envio.current) return;
        const quantia = Number(valor);
        const centavos = Math.round(quantia * 100);
        if (!valor.trim() || !Number.isFinite(quantia) || !Number.isSafeInteger(centavos) || centavos <= 0 || Math.abs(quantia * 100 - centavos) > 0.000001) {
            setErro("Informe um valor positivo com até duas casas decimais.");
            return;
        }
        if (!dados.data || !Number.isFinite(new Date(dados.data).getTime())) {
            setErro("Informe uma data válida.");
            return;
        }
        if (!Object.prototype.hasOwnProperty.call(formasPagamento, dados.forma) || !Object.prototype.hasOwnProperty.call(statusPagamento, dados.status)) {
            setErro("Selecione a forma e o status do pagamento.");
            return;
        }
        envio.current = true;
        setSalvando(true);
        setErro("");
        try {
            const atual = await locacaoService.buscarPorId(locacaoId);
            if (atual.status === "CANCELADA" && !editando) {
                throw new Error("Não é possível registrar pagamentos em uma locação cancelada.");
            }
            const payload: Pagamento = { ...dados, locacaoId, valor: centavos / 100 };
            const salvo = editando
                ? await pagamentoService.atualizar(String(pagamento?.id), payload)
                : await pagamentoService.criar(payload);
            onSaved(salvo, editando);
        } catch (e) {
            setErro(e instanceof Error ? e.message : "Não foi possível salvar o pagamento.");
        } finally {
            envio.current = false;
            setSalvando(false);
        }
    }

    return (
        <Modal show title={editando ? "Editar pagamento" : "Registrar pagamento"} onClose={onClose}>
            <form onSubmit={salvar}>
                {erro && <Alert type="danger" message={erro} onClose={() => setErro("")} />}
                <Input label="Data do pagamento" name="dataPagamento" type="datetime-local"
                    value={dados.data} required disabled={salvando}
                    onChange={e => setDados(d => ({ ...d, data: e.target.value }))} />
                <Input label="Valor (R$)" name="valorPagamento" type="number" min={0.01} step={0.01}
                    value={valor} required disabled={salvando} onChange={e => setValor(e.target.value)} />
                <Select label="Forma de pagamento" name="formaPagamento" value={dados.forma}
                    required disabled={salvando}
                    options={Object.entries(formasPagamento).map(([value, label]) => ({ value, label }))}
                    onChange={e => setDados(d => ({ ...d, forma: e.target.value as FormaPagamento }))} />
                <Select label="Status do pagamento" name="statusPagamento" value={dados.status}
                    required disabled={salvando}
                    options={Object.entries(statusPagamento).map(([value, label]) => ({ value, label }))}
                    onChange={e => setDados(d => ({ ...d, status: e.target.value as StatusPagamento }))} />
                <div className="d-flex justify-content-end gap-2 border-top pt-3 mt-3">
                    <Button label="Cancelar" variant="secondary" disabled={salvando} onClick={onClose} />
                    <Button label={salvando ? "Salvando..." : "Salvar pagamento"} type="submit" disabled={salvando} />
                </div>
            </form>
        </Modal>
    );
}
