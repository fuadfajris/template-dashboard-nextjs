"use client";

type PaginatorProps = {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
};

export default function Paginator({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
}: PaginatorProps) {
  const totalPages = Math.ceil(totalItems / pageSize);
  const start = currentPage ? (currentPage - 1) * pageSize + 1 : 0;
  const end = Math.min(currentPage * pageSize, totalItems);

  // ✅ kalau lebih dari 1 halaman, tampilkan paginator
  return (
    <div className="flex items-center justify-between mt-4 text-sm text-gray-700 dark:text-gray-300">
      {/* Info kiri */}
      <div>
        Showing {start} to {end} of {totalItems} entries
      </div>

      {/* Paginator kanan */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-3 py-1 border rounded disabled:opacity-50 dark:border-gray-700"
        >
          Prev
        </button>

        {/* Angka halaman aktif */}
        <span className="px-2 font-medium">{currentPage}</span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border rounded disabled:opacity-50 dark:border-gray-700"
        >
          Next
        </button>
      </div>
    </div>
  );
}
