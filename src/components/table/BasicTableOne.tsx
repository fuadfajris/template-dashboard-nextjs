"use client";

import { useState, useMemo, useEffect, ReactNode } from "react";
import Paginator from "./Paginator";

type Column<T> = { key: keyof T & string; label: string };

type SortConfig<T> = {
  key: keyof T & string;
  direction: "asc" | "desc";
} | null;

// ✅ Nilai cell bisa string | number | ReactNode
export type TableRow = Record<string, string | number | ReactNode>;

export default function BasicTableOne<T extends TableRow>({
  columns,
  rows,
  pageSize = 10,
}: {
  columns: Column<T>[];
  rows: T[];
  pageSize?: number;
}) {
  const [currentPage, setCurrentPage] = useState(0);
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>(null);

  useEffect(() => {
    setCurrentPage(rows.length ? 1 : 0);
  }, [rows]);

  const handleSort = (key: keyof T & string) => {
    setSortConfig((prev) => {
      if (prev && prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  const sortedRows = useMemo(() => {
    if (!sortConfig) return rows;
    return [...rows].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      // hanya bisa sort number/string
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortConfig.direction === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return 0; // ReactNode atau tipe lain tidak disort
    });
  }, [rows, sortConfig]);

  const totalPages = Math.ceil(sortedRows.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const currentRows = sortedRows.slice(startIndex, startIndex + pageSize);

  return (
    <div className="overflow-x-auto whitespace-nowrap">
      <table className="w-full border-collapse border border-gray-300 dark:border-gray-700">
        <thead className="bg-gray-100 dark:bg-gray-800">
          <tr>
            {columns.map((col) => {
              const isSorted = sortConfig?.key === col.key;
              return (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="cursor-pointer border border-gray-300 dark:border-gray-700 px-4 py-2 text-left text-gray-700 dark:text-gray-200 select-none"
                >
                  {col.label}{" "}
                  {isSorted && (sortConfig?.direction === "asc" ? "↑" : "↓")}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {currentRows.length > 0 ? (
            currentRows.map((row, idx) => (
              <tr
                key={idx}
                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-gray-800 dark:text-gray-100"
                  >
                    {row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="border border-gray-300 dark:border-gray-700 px-4 py-4 text-center text-gray-500 dark:text-gray-400"
              >
                Tidak ada data
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <Paginator
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={sortedRows.length}
        onPageChange={(p) => {
          setCurrentPage(p);
        }}
      />
    </div>
  );
}
