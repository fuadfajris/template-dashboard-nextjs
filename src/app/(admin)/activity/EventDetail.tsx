// components/activities/EventDetail.tsx
export default function EventDetail({ data }: { data: any }) {
  return (
    <div className="p-4 border rounded bg-blue-50">
      <h2 className="font-bold text-lg">Event Detail</h2>
      <p>
        <strong>Event Name:</strong> {data.name}
      </p>
      <p>
        <strong>Location:</strong> {data.location}
      </p>
    </div>
  );
}
