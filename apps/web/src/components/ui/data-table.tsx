import type { ReactNode } from "react";

type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  emptyTitle: string;
  emptyDescription: string;
  getRowKey?: (row: T, index: number) => string;
};

export function DataTable<T>({ columns, rows, emptyTitle, emptyDescription, getRowKey }: DataTableProps<T>) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-stone-50 p-8 text-center">
        <h3 className="text-base font-semibold text-ink">{emptyTitle}</h3>
        <p className="mt-2 text-sm text-stone-600">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-panel">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-line text-left">
          <thead className="bg-stone-50">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {rows.map((row, index) => (
              <tr
                key={getRowKey ? getRowKey(row, index) : typeof row === "object" && row !== null && "id" in row ? String(row.id) : index}
                className="hover:bg-stone-50/70"
              >
                {columns.map((column) => (
                  <td key={column.key} className={`px-4 py-3 text-sm text-stone-700 ${column.className ?? ""}`}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
