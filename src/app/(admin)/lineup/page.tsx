"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import Select from "@/components/form/Select";
import Label from "@/components/form/Label";
import { ChevronDownIcon } from "@/icons";
import ChartTab from "@/components/common/ChartTab";
import BasicTableOne from "@/components/table/BasicTableOne";
import AddGuestModal from "./AddGuestModal";
import EditGuestModal from "./EditGuestModal";

// Option untuk Select
type Option = {
  value: string;
  label: string;
};

// Struktur Guest dari API
type GuestInfo = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role?: string;
  invitation_status?: string;
  category?: string;
  image?: string;
  event_id: number;
};

// Item jadwal guest
type GuestItem = {
  id: string;
  guest_id: string;
  event_id: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  stage: string;
  guest: GuestInfo;
  schedule_id: string;
};

// Struktur data per tanggal
type DaySchedule = {
  date: string;
  guests: GuestItem[];
};

export default function GuestPage() {
  const { user } = useUser();
  const [events, setEvents] = useState<Option[]>([]);
  const [eventDays, setEventDays] = useState<DaySchedule[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [eventId, setEventId] = useState<string>("");
  const [editOpen, setEditOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<GuestItem | null>(null);

  // Set judul halaman
  useEffect(() => {
    document.title = "Lineup - MyApp";
  }, []);

  // Fetch event untuk merchant
  useEffect(() => {
    const fetchEvents = async () => {
      if (!user?.id) return;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/events/merchant/${user.id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (!res.ok) {
        console.error("Failed to fetch events:", res.status, res.statusText);
        return;
      }

      const result = await res.json();
      const data: { id: string; name: string }[] = result;

      const formattedEvents = data.map((event) => ({
        value: event.id,
        label: event.name,
      }));

      setEvents(formattedEvents);
      setEventId(data.length !== 0 ? data[0].id : "");
    };

    fetchEvents();
  }, [user]);

  // Fetch data guest per event
  useEffect(() => {
    eventId && handleSelectChange(eventId);
  }, [eventId]);

  const handleSelectChange = async (eventId: string) => {
    setEventId(eventId);

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/guests/lineup/${eventId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
      }
    );

    if (!res.ok) {
      console.error(
        "Failed to fetch event activities:",
        res.status,
        res.statusText
      );
      return;
    }

    const result = await res.json();
    const data: GuestItem[] = result;

    // Group by schedule_date
    const daysMap: Record<string, GuestItem[]> = {};
    data.forEach((item) => {
      if (!daysMap[item.schedule_date]) daysMap[item.schedule_date] = [];
      daysMap[item.schedule_date].push(item);
    });

    const daysArray: DaySchedule[] = Object.entries(daysMap)
      .map(([date, guests]) => ({ date, guests }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setEventDays(daysArray);
  };

  const handleEditClick = (guest: GuestItem) => {
    console.log(guest)
    setSelectedGuest(guest);
    setEditOpen(true);
  };

  const handleDelete = async (guest: GuestItem) => {
    console.log(guest)
    if (!confirm(`Are you sure you want to delete ${guest.guest.name}?`)) return;

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/guests/lineup/${guest.id}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
      }
    );

    if (!res.ok) {
      console.error("Failed to delete guest schedule");
      return;
    }

    // Refresh data
    handleSelectChange(eventId);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="w-full md:w-1/2 px-6 py-5">
        <Label>Select an Event</Label>
        <div className="relative">
          <Select
            options={events}
            defaultValue={eventId}
            placeholder="Select Option"
            onChange={handleSelectChange}
            className="dark:bg-dark-900"
          />
          <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
            <ChevronDownIcon />
          </span>
        </div>
      </div>

      {eventDays.length > 0 ? (
        <>
          <div className="px-6 py-5">
            <ChartTab
              eventDays={eventDays}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>

          <div className="px-6 pb-6">
            <AddGuestModal
              eventId={eventId}
              onAdded={() => handleSelectChange(eventId)}
            />
          </div>

          <div className="px-6 pb-6">
            <BasicTableOne
              columns={[
                { key: "name", label: "Name" },
                { key: "phone", label: "Phone" },
                { key: "stage", label: "Stage" },
                { key: "start", label: "Start" },
                { key: "end", label: "End" },
                { key: "actions", label: "Actions" },
              ]}
              rows={(eventDays[activeTab]?.guests || []).map((g) => ({
                name: g.guest.name ?? "-",
                phone: g.guest.phone ?? "-",
                stage: g.stage ?? "-",
                start: g.start_time ?? "-",
                end: g.end_time ?? "-",
                actions: (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditClick(g)}
                      className="px-2 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(g)}
                      className="px-2 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                ),
              }))}
            />

            <EditGuestModal
              eventId={eventId}
              guest={selectedGuest}
              open={editOpen}
              onClose={() => setEditOpen(false)}
              onUpdated={() => handleSelectChange(eventId)}
            />
          </div>
        </>
      ) : (
        <>
          {eventId && (
            <div className="px-6 pb-6">
              <AddGuestModal
                eventId={eventId}
                onAdded={() => handleSelectChange(eventId)}
              />
            </div>
          )}
          <div className="px-6 py-5 text-center text-gray-500">
            No event days available
          </div>
        </>
      )}
    </div>
  );
}