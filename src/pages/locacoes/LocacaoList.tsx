import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Select } from "../../components/Select";
import { Alert } from "../../components/Alert";
import { Table, type Column } from "../../components/Table";

import type { Locacao } from "../../models/Locacao";
import type { Cliente } from "../../models/Cliente";
import type { Veiculo } from "../../models/Veiculo";
import type { Modelo } from "../../models/Modelo";

import { locacaoService } from "../../service/locacaoService";
import { clienteService } from "../../service/clienteService";
import { veiculoService } from "../../service/veiculoService";
import { modeloService } from "../../service/modeloService";

export function LocacaoList() {
    const navigate = useNavigate();
    const location = useLocation();

    const [registros, setRegistros] = useState<Locacao[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
    const [modelos, setModelos] = useState<Modelo[]>([]);

    const [status, setStatus] = useState("");
    const [cliente, setCliente] = useState("");

    const [carregando, setCarregando] = useState(true);
    const [falha, setFalha] = useState(false);

    const [mensagem, setMensagem] = useState<{
        type: "success" | "danger";
        message: string;
    } | null>(() => {
        const state = location.state as { sucesso?: string } | null;

        return state?.sucesso
            ? { type: "success", message: state.sucesso }
            : null;
    });

    // Carregamento dos dados
    useEffect(() => {
        let ativo = true;

        Promise.all([
            locacaoService.listar(),
            clienteService.listar(),
            veiculoService.listar(),
            modeloService.listar()
        ])
            .then(([l, c, v, m]) => {
                if (ativo) {
                    setRegistros(l);
                    setClientes(c);
                    setVeiculos(v);
                    setModelos(m);
                }
            })
            .catch(() => {
                if (ativo) {
                    setFalha(true);
                    setMensagem({
                        type: "danger",
                        message: "Não foi possível carregar as locações."
                    });
                }
            })
            .finally(() => {
                if (ativo) {
                    setCarregando(false);
                }
            });

        return () => {
            ativo = false;
        };
    }, []);

    const filtrados = registros.filter(
        (l) =>
            (!status || l.status === status) &&
            (!cliente || l.clienteId === cliente)
    );

    const data = (v: string) =>
        new Date(v).toLocaleString("pt-BR");

    const columns: Column<Locacao>[] = [
        {
            header: "Cliente",
            render: (l) =>
                clientes.find((c) => c.id === l.clienteId)?.nome
                ?? l.clienteId
        },
        {
            header: "Veículo",
            render: (l) => {
                const veiculo = veiculos.find(
                    (v) => v.id === l.veiculoId
                );

                if (!veiculo) return l.veiculoId;

                const modelo = modelos.find(
                    (m) => m.id === veiculo.modeloId
                );

                return `${veiculo.placa} · ${modelo?.nome ?? "Modelo não identificado"}`;
            }
        },
        {
            header: "Retirada",
            render: (l) => data(l.dataRetirada)
        },
        {
            header: "Devolução prevista",
            render: (l) => data(l.dataDevolucaoPrevista)
        },
        {
            header: "Valor",
            render: (l) =>
                l.valorTotal.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL"
                })
        },
        {
            header: "Status",
            render: (l) => (
                <span
                    className={`badge ${
                        l.status === "ABERTA"
                            ? "text-bg-primary"
                            : l.status === "FINALIZADA"
                                ? "text-bg-success"
                                : "text-bg-secondary"
                    }`}
                >
                    {l.status}
                </span>
            )
        }
    ];

    return (
        <section className="container-xl py-5">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                <div>
                    <h2>Locações</h2>
                    <p className="text-body-secondary mb-0">
                        Gerencie as locações da sua frota.
                    </p>
                </div>

                <Button
                    label="+ Nova locação"
                    disabled={carregando || falha}
                    onClick={() => navigate("/locacoes/novo")}
                />
            </div>

            {mensagem && (
                <Alert
                    {...mensagem}
                    onClose={() => {
                        setMensagem(null);

                        if (location.state) {
                            navigate(location.pathname, {
                                replace: true,
                                state: null
                            });
                        }
                    }}
                />
            )}

            <div className="border rounded-3 p-3 mb-4 bg-body-tertiary d-inline-flex flex-column">
                <span className="small text-body-secondary">
                    Total de locações
                </span>

                <strong className="fs-2 text-primary">
                    {carregando || falha
                        ? "—"
                        : String(registros.length).padStart(2, "0")}
                </strong>
            </div>

            <Card title="Locações cadastradas">
                {/* Filtros */}
                <div className="row">
                    <div className="col-md-6">
                        <Select
                            label="Filtrar por status"
                            name="status"
                            value={status}
                            placeholder="Todos"
                            onChange={(e) => setStatus(e.target.value)}
                            options={[
                                { value: "ABERTA", label: "Aberta" },
                                { value: "FINALIZADA", label: "Finalizada" },
                                { value: "CANCELADA", label: "Cancelada" }
                            ]}
                        />
                    </div>

                    <div className="col-md-6">
                        <Select
                            label="Filtrar por cliente"
                            name="cliente"
                            value={cliente}
                            placeholder="Todos"
                            onChange={(e) => setCliente(e.target.value)}
                            options={clientes.flatMap((c) =>
                                c.id
                                    ? [{ value: c.id, label: c.nome }]
                                    : []
                            )}
                        />
                    </div>
                </div>

                {carregando ? (
                    <p>Carregando...</p>
                ) : !falha && (
                    <>
                        <Table
                            columns={columns}
                            data={filtrados}
                            acoesExtras={(l) => (
                                <Button
                                    label="Detalhes"
                                    variant="outline-primary"
                                    size="sm"
                                    disabled={!l.id}
                                    onClick={() =>
                                        navigate(`/locacoes/${l.id}`)
                                    }
                                />
                            )}
                        />

                        <p className="small text-body-secondary mb-0">
                            Exibindo {filtrados.length} de{" "}
                            {registros.length} registros.
                        </p>
                    </>
                )}
            </Card>
        </section>
    );
}