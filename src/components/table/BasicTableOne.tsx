"use client"

type Column = { key: string; label: string };

export default function BasicTableOne({
  columns,
  rows,
}: {
  columns: Column[];
  rows: Record<string, any>[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300 dark:border-gray-700">
        <thead className="bg-gray-100 dark:bg-gray-800">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left text-gray-700 dark:text-gray-200"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? (
            rows.map((row, idx) => (
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
    </div>
  );
}
