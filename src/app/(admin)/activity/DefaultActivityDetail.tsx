export default function DefaultActivityDetail({ data }: { data: any }) {
  return (
    <div className="border p-4 rounded bg-gray-50">
      <h2 className="font-semibold text-lg mb-2">Generic Activity Detail</h2>
      <pre className="text-sm bg-white p-2 rounded border">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
