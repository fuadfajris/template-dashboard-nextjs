"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/context/UserContext";
import Select from "@/components/form/Select";
import Label from "@/components/form/Label";
import { ChevronDownIcon } from "@/icons";
import ChartTab from "@/components/common/ChartTab";
import BasicTableOne from "@/components/table/BasicTableOne";
import AddGuestModal from "./AddGuestModal";
import EditGuestModal from "./EditGuestModal";

type Option = {
  value: string;
  label: string;
};

type Guest = {
  name: string;
  email: string;
  phone: string;
  stage: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  schedule_id: string;
};

type DaySchedule = {
  date: string;
  guests: Guest[];
};

export default function GuestPage() {
  const { user } = useUser();
  const [events, setEvents] = useState<Option[]>([]);
  const [eventDays, setEventDays] = useState<DaySchedule[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [eventId, setEventId] = useState<string>("");
  const [editOpen, setEditOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<any>(null);

  useEffect(() => {
    document.title = "Lineup - MyApp";
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from("events")
        .select("id, name")
        .eq("status", true)
        .eq("merchant_id", user.id)
        .order("id", { ascending: true });

      if (error) {
        console.error("Failed to fetch events:", error.message);
        return;
      }

      if (data) {
        const formattedEvents = data.map((event) => ({
          value: event.id,
          label: event.name,
        }));
        setEvents(formattedEvents);
        setEventId(data.length !== 0 ? data[0].id : "");
      }
    };

    fetchEvents();
  }, [user]);

  useEffect(() => {
    eventId && handleSelectChange(eventId);
  }, [eventId]);

  const handleSelectChange = async (eventId: string) => {
    setEventId(eventId);
    const { data, error } = await supabase
      .from("guest_schedules")
      .select(
        `
        id,
        schedule_date,
        start_time,
        end_time,
        stage,
        guests (
          name,
          email,
          phone
        )
      `
      )
      .eq("event_id", eventId);

    if (error) {
      console.error("Failed to fetch event activities:", error.message);
      return;
    }

    const daysMap: Record<string, Guest[]> = {};
    data.forEach((item) => {
      const guestList = Array.isArray(item.guests)
        ? item.guests
        : [item.guests];

      guestList.forEach((guest) => {
        if (!daysMap[item.schedule_date]) {
          daysMap[item.schedule_date] = [];
        }

        daysMap[item.schedule_date].push({
          name: guest.name ?? "-",
          email: guest.email ?? "-",
          phone: guest.phone ?? "-",
          stage: item.stage ?? "-",
          schedule_date: item.schedule_date ?? "-",
          start_time: item.start_time ?? "-",
          end_time: item.end_time ?? "-",
          schedule_id: item.id,
        });
      });
    });

    const daysArray: DaySchedule[] = Object.entries(daysMap)
      .map(([date, guests]) => ({
        date,
        guests,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setEventDays(daysArray);
  };

  const handleEditClick = (guest: any) => {
    setSelectedGuest(guest);
    setEditOpen(true);
  };

  const handleDelete = async (guest: Guest) => {
    if (!confirm(`Are you sure you want to delete ${guest.name}?`)) return;

    const { error } = await supabase
      .from("guest_schedules")
      .delete()
      .eq("id", guest.schedule_id);

    if (error) {
      console.error("Failed to delete schedule:", error.message);
      return;
    }

    // refresh data
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
                name: g.name,
                phone: g.phone,
                stage: g.stage,
                start: g.start_time,
                end: g.end_time,
                actions: (
                  <div className="flex gap-2">
                    {/* Edit button */}
                    <button
                      onClick={() => handleEditClick(g)}
                      className="px-2 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
                    >
                      Edit
                    </button>

                    {/* Delete button */}
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
              onUpdated={() => handleSelectChange(eventId)} // refresh tabel
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
