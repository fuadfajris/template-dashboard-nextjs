"use client";

import { useState, useMemo, useEffect } from "react";
import Paginator from "./Paginator";

type Column = { key: string; label: string };

type SortConfig = {
  key: string;
  direction: "asc" | "desc";
} | null;

export default function BasicTableOne({
  columns,
  rows,
  pageSize = 10,
}: {
  columns: Column[];
  rows: Record<string, any>[];
  pageSize?: number;
}) {
  const [currentPage, setCurrentPage] = useState(0);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  useEffect(() => {
    setCurrentPage(rows.length ? 1 : 0)
  }, [rows]);

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev && prev.key === key) {
        // toggle asc/desc
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

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }

      return sortConfig.direction === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
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

      {/* Paginator */}
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
