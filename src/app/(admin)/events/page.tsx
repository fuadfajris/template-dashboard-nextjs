"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/context/UserContext";
import BasicTableOne from "@/components/table/BasicTableOne";
import Link from "next/link";
import Image from "next/image";

type EventItem = {
  id: string;
  image_venue: string;
  name: string;
  description?: string | null;
  location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  capacity?: number | null;
  status?: boolean;
};

type EventRow = {
  index: number;
  eventName: string;
  startDate: string;
  endDate: string;
  status: string;
  action: React.ReactNode;
};

export default function EventPage() {
  const { user } = useUser();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [searchTerm, setSearchTerm] = useState(""); // ✅ search state
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: "",
    description: "",
    location: "",
    start_date: "",
    end_date: "",
    capacity: "",
    status: true,
    image_venue: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Event - MyApp";
  }, []);

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const fetchEvents = async (search?: string) => {
    if (!user?.id) return;
    setLoading(true);

    let query = supabase
      .from("events")
      .select(
        "id, image_venue, name, description, location, start_date, end_date, capacity, status"
      )
      .eq("merchant_id", user.id)
      .order("id", { ascending: true });

    if (search && search.trim() !== "") {
      query = query.or(
        `name.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    setLoading(false);

    if (error) {
      console.error("Failed to fetch events:", error.message);
      return;
    }

    if (data) setEvents(data);
  };

  const handleAddEvent = async () => {
    if (!user?.id) return;

    // ✅ Validasi data wajib
    if (
      !newEvent.name.trim() ||
      !newEvent.description.trim() ||
      !newEvent.location.trim() ||
      !newEvent.start_date ||
      !newEvent.end_date ||
      !newEvent.capacity
    ) {
      alert("Semua field wajib diisi!");
      return;
    }

    let imageUrl: string | null = null;

    // upload file jika ada
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "event");
      formData.append("scope", "event");
      formData.append("template_id", "1");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errRes = await res.json();
        alert(errRes.error || "Upload failed");
        return;
      }

      const { url } = await res.json();
      imageUrl = url;
    }

    const { error } = await supabase.from("events").insert([
      {
        merchant_id: user.id,
        name: newEvent.name,
        description: newEvent.description,
        location: newEvent.location,
        start_date: newEvent.start_date,
        end_date: newEvent.end_date,
        capacity: parseInt(newEvent.capacity),
        status: newEvent.status,
        image_venue: imageUrl,
      },
    ]);

    if (error) {
      console.error("Failed to insert event:", error.message);
      return;
    }

    setShowAddModal(false);
    setNewEvent({
      name: "",
      description: "",
      location: "",
      start_date: "",
      end_date: "",
      capacity: "",
      status: true,
      image_venue: "",
    });
    setFile(null);
    setPreview(null);

    fetchEvents();
  };

  const columns: { key: keyof EventRow & string; label: string }[] = [
    { key: "index", label: "No" },
    { key: "eventName", label: "Event Name" },
    { key: "startDate", label: "Start Date" },
    { key: "endDate", label: "End Date" },
    { key: "status", label: "Status" },
    { key: "action", label: "Action" },
  ];

  const rows = events.map((evt, idx) => {
    const now = new Date();
    const startDate = evt.start_date ? new Date(evt.start_date) : null;
    const endDate = evt.end_date ? new Date(evt.end_date) : null;
    const isPast = endDate ? endDate < now : false;

    return {
      index: idx + 1,
      eventName: evt.name || "-",
      startDate: startDate ? startDate.toLocaleDateString("id-ID") : "-",
      endDate: endDate ? endDate.toLocaleDateString("id-ID") : "-",
      status: evt.status ? "Active" : "Nonactive",
      action: isPast ? (
        "-"
      ) : (
        <div className="flex gap-2">
          <Link
            href={`/events/${evt.id}`}
            className="bg-blue-600 text-white px-3 py-1 rounded"
          >
            Detail
          </Link>
        </div>
      ),
    };
  });

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-6 pt-5">
          <h1 className="text-xl font-bold mb-4 text-gray-800 dark:text-white/90">
            List Event
          </h1>
          <div className="flex flex-col justify-end md:flex-row gap-2 w-full md:w-fit">
            {/* ✅ Input Search + Button */}
            <input
              type="text"
              placeholder="Search event..."
              className="border rounded px-3 py-2 border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] text-gray-800 dark:text-white/90"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              onClick={() => fetchEvents(searchTerm)}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Search
            </button>
            <button
              onClick={() => {
                setShowAddModal(true);
                setPreview(null);
              }}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              + Add Event
            </button>
          </div>
        </div>

        <div className="px-6 py-5">
          {loading ? (
            <p>Loading...</p>
          ) : events.length === 0 ? (
            <p className="text-gray-500">Tidak ada event</p>
          ) : (
            <BasicTableOne columns={columns} rows={rows} />
          )}
        </div>
      </div>

      {/* Modal Tambah Event */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="w-full max-w-4xl p-6 rounded-lg bg-primary/5 bg-white dark:bg-gray-800">
            <div className="grid gap-4 max-h-[calc(90vh-3rem)] overflow-y-auto pr-2">
              <h2 className="text-lg font-bold mb-4 col-span-12 text-gray-800 dark:text-white/90">
                Tambah Event
              </h2>

              {/* Name and Location */}
              <input
                type="text"
                placeholder="Event Name"
                className="w-full border rounded-lg p-2 mb-2 col-span-12 lg:col-span-6 bg-input"
                value={newEvent.name}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, name: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Location"
                className="w-full border rounded-lg p-2 mb-2 col-span-12 lg:col-span-6 bg-input"
                value={newEvent.location}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, location: e.target.value })
                }
              />

              {/* Description */}
              <textarea
                placeholder="Description"
                className="w-full border rounded-lg p-2 mb-2 col-span-12 h-32 resize-y bg-input"
                value={newEvent.description}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, description: e.target.value })
                }
              />

              {/* Start and End Date */}
              <input
                type="date"
                className="w-full border rounded-lg p-2 mb-2 col-span-12 lg:col-span-6 bg-input"
                value={newEvent.start_date}
                min={new Date().toISOString().split("T")[0]} // ✅ minimal hari ini
                onChange={(e) =>
                  setNewEvent({ ...newEvent, start_date: e.target.value })
                }
              />
              <input
                type="date"
                className="w-full border rounded-lg p-2 mb-2 col-span-12 lg:col-span-6 bg-input"
                value={newEvent.end_date}
                min={
                  newEvent.start_date || new Date().toISOString().split("T")[0]
                } // ✅ minimal sama dengan start_date
                onChange={(e) =>
                  setNewEvent({ ...newEvent, end_date: e.target.value })
                }
              />

              {/* Image */}
              <div className="col-span-12 grid grid-cols-12 gap-4 items-start">
                <div className="col-span-12 lg:col-span-6">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="w-full border rounded-lg p-2 mb-2 col-span-12 lg:col-span-6 bg-input"
                  />
                </div>
                <div className="col-span-12 lg:col-span-6 flex items-center">
                  {(preview || newEvent.image_venue) && (
                    <Image
                      src={
                        preview
                          ? preview
                          : newEvent.image_venue
                          ? `/api/upload?file=${newEvent.image_venue}`
                          : "/api/upload?file=/uploads/event/placeholder.png"
                      }
                      alt="preview"
                      width={100}
                      height={100}
                      className="w-auto h-40 object-cover rounded-lg"
                    />
                  )}
                </div>
              </div>

              {/* Capacity and Status */}
              <input
                type="number"
                placeholder="Capacity"
                className="w-full border rounded-lg p-2 mb-2 col-span-12 lg:col-span-6 bg-input"
                value={newEvent.capacity}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, capacity: e.target.value })
                }
              />
              <select
                className="w-full border rounded-lg p-2 mb-2 col-span-12 lg:col-span-6 bg-input"
                value={newEvent.status ? "true" : "false"}
                onChange={(e) =>
                  setNewEvent({
                    ...newEvent,
                    status: e.target.value === "true",
                  })
                }
              >
                <option value="true">Active</option>
                <option value="false">Nonactive</option>
              </select>

              <div className="col-span-12">
                <div className="flex justify-end gap-2">
                  <button
                    className="px-4 py-2 bg-gray-400 text-white rounded"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-green-600 text-white rounded"
                    onClick={handleAddEvent}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
