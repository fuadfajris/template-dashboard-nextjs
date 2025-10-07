"use client";

import { useEffect, useRef, useState } from "react";
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
  template_id: number;
};

type EventRow = {
  index: number;
  eventName: string;
  startDate: string;
  endDate: string;
  status: string;
  action: React.ReactNode;
};

type Template = {
  id: number;
  title: string;
  category: string;
  thumbnail: string | null;
  description: string | null;
  url: string | null;
  features: string[];
};

type RawTemplate = {
  id: number;
  title: string;
  category: string;
  thumbnail: string | null;
  description: string | null;
  url: string | null;
  features?: Feature[];
};

type Feature = {
  feature_name: string;
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
  const [templates, setTemplates] = useState<Template[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    document.title = "Event - MyApp";
  }, []);

  useEffect(() => {
    fetchEvents();
    fetchTemplates();
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

  const fetchTemplates = async () => {
    if (!user?.id || !user.token) return;

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/templates`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user?.token}`,
      },
    });

    if (!res.ok) {
      console.error("Failed to fetch templates:", res.status, res.statusText);
      return;
    }
    const result = await res.json();
    const data = result.data;

    const mapped: Template[] = (data as RawTemplate[]).map((t) => ({
      id: t.id,
      title: t.title,
      category: t.category,
      thumbnail: t.thumbnail,
      description: t.description,
      url: t.url,
      features: t.features ? t.features.map((f) => f.feature_name) : [],
    }));

    setTemplates(mapped);
  };

  const fetchEvents = async (search?: string) => {
    if (!user?.id || !user.token) return;
    setLoading(true);

    try {
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
        const err = await res.json().catch(() => null);
        console.error(
          "Failed to fetch events:",
          err?.message || res.statusText
        );
        setEvents([]);
        setLoading(false);
        return;
      }

      const result = await res.json();
      const data: EventItem[] = result ?? [];
      setEvents(data);
    } catch (error) {
      console.error("Failed to fetch events:", error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
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
      formData.append("template_url", String(templates[0].url));

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

    const req = {
      merchant_id: user.id,
      name: newEvent.name,
      description: newEvent.description,
      location: newEvent.location,
      start_date: newEvent.start_date,
      end_date: newEvent.end_date,
      capacity: parseInt(newEvent.capacity),
      status: newEvent.status,
      image_venue: imageUrl,
    };

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify(req),
    });

    if (!res.ok) {
      console.log(res);
      console.error("Failed to insert event:", res);
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
    const templateUrl = templates.find((t) => t.id === evt.template_id)?.url;

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

          {templateUrl && (
            <a
              href={`${templateUrl}?event_id=${evt.id}&merchant_id=${user?.id}&edit=true`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 text-white px-3 py-1 rounded"
            >
              Visit
            </a>
          )}
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
                    ref={fileInputRef}
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="w-full border rounded-lg p-2 mb-2 col-span-12 lg:col-span-6 bg-input"
                  />
                </div>
                <div className="col-span-12 lg:col-span-6 flex items-center">
                  {(preview || newEvent.image_venue) && (
                    <div className="relative">
                      <Image
                        src={
                          preview
                            ? preview
                            : newEvent.image_venue
                            ? `/api/upload?file=${newEvent.image_venue}`
                            : "/api/upload?file=/uploads/event/placeholder.jpg"
                        }
                        alt="preview"
                        width={100}
                        height={100}
                        className="w-auto h-40 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        className="absolute top-0 right-0 p-1 bg-black text-white rounded-lg"
                        onClick={() => {
                          setFile(null);
                          setPreview(null);
                          setNewEvent({ ...newEvent, image_venue: "" });
                          if (fileInputRef.current)
                            fileInputRef.current.value = "";
                        }}
                      >
                        Delete
                      </button>
                    </div>
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
                <option value="true" className="!text-gray-800">
                  Active
                </option>
                <option value="false" className="!text-gray-800">
                  Nonactive
                </option>
              </select>

              <div className="col-span-12">
                <div className="flex justify-end gap-2">
                  <button
                    className="px-4 py-2 bg-gray-400 text-white rounded"
                    onClick={() => {
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
                    }}
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
