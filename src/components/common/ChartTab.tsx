// components/common/ChartTab.tsx
"use client"

type EventDay = {
  date: string;
  guests: { name: string; type: string; location: string; image?: string }[];
};

export default function ChartTab({
  eventDays,
  activeTab,
  onTabChange,
}: {
  eventDays: EventDay[];
  activeTab: number;
  onTabChange: (idx: number) => void;
}) {
  return (
    <div className="flex gap-2 mb-4">
      {eventDays.map((day, idx) => (
        <button
          key={idx}
          onClick={() => onTabChange(idx)}
          className={`px-4 py-2 rounded ${
            activeTab === idx ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          Hari {idx + 1} ({day.date})
        </button>
      ))}
    </div>
  );
}
