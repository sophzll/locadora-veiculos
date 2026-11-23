import type { ReactNode } from "react";
import { Button } from "./Button";

export interface Column<T> {
  header: string;
  render: (item: T) => ReactNode;
}

interface TableProps<T extends { id?: string }> {
  columns: Column<T>[];
  data: T[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  acoesExtras?: (item: T) => ReactNode;
  emptyMessage?: string;
}

export function Table<T extends { id?: string }>({
  columns,
  data,
  onEdit,
  onDelete,
  acoesExtras,
  emptyMessage = "Nenhum registro encontrado.",
}: TableProps<T>) {
  const temAcoes = Boolean(onEdit || onDelete || acoesExtras);
  const totalColunas = columns.length + (temAcoes ? 1 : 0);

  return (
    <div className="table-responsive">
      <table className="table table-striped table-hover align-middle">
        <thead>
          <tr>
            {columns.map((coluna) => (
              <th key={coluna.header}>{coluna.header}</th>
            ))}
            {temAcoes && <th className="text-end">Ações</th>}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={totalColunas} className="text-center text-muted">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, indice) => (
              <tr key={item.id ?? indice}>
                {columns.map((coluna) => (
                  <td key={coluna.header}>{coluna.render(item)}</td>
                ))}
                {temAcoes && (
                  <td className="text-end">
                    <div className="d-inline-flex gap-2">
                      {acoesExtras?.(item)}
                      {onEdit && (
                        <Button
                          label="Editar"
                          variant="warning"
                          size="sm"
                          onClick={() => onEdit(item)}
                        />
                      )}
                      {onDelete && (
                        <Button
                          label="Excluir"
                          variant="danger"
                          size="sm"
                          onClick={() => onDelete(item)}
                        />
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
