"use client";

import { useEffect, useRef, useState } from "react";
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

export default function EventPage() {
  const { user } = useUser();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [searchTerm, setSearchTerm] = useState(""); // ✅ search state
  const [loading, setLoading] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
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

  const [editEvent, setEditEvent] = useState<EventItem | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Event - MyApp";
  }, []);

  useEffect(() => {
    fetchEvents(); // load awal
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
      .eq("merchant_id", user.id);

    // ✅ kalau ada search, filter langsung ke DB
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

  const handleEditClick = (evt: EventItem) => {
    setPreview(evt.image_venue || null);
    setEditEvent(evt);
    setShowEditModal(true);
  };

  const handleAddEvent = async () => {
    if (!user?.id || !newEvent.name.trim()) return;

    let imageUrl: string | null = null;

    // kalau ada file gambar → upload dulu
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "event"); // 👉 folder dinamis

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
        description: newEvent.description || null,
        location: newEvent.location || null,
        start_date: newEvent.start_date || null,
        end_date: newEvent.end_date || null,
        capacity: newEvent.capacity ? parseInt(newEvent.capacity) : null,
        status: newEvent.status,
        image_venue: imageUrl, // ✅ simpan ke DB
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

  const handleUpdateEvent = async () => {
    if (!editEvent) return;

    let imageUrl = editEvent.image_venue;

    // kalau ada file baru → hapus lama + upload baru
    if (file) {
      // hapus file lama
      if (
        editEvent.image_venue &&
        editEvent.image_venue.startsWith("/uploads/event/")
      ) {
        await fetch("/api/delete-file", {
          method: "POST",
          body: JSON.stringify({ filePath: editEvent.image_venue }),
          headers: { "Content-Type": "application/json" },
        });
      }

      // upload file baru
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "event");

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

    const { error } = await supabase
      .from("events")
      .update({
        name: editEvent.name,
        description: editEvent.description,
        location: editEvent.location,
        start_date: editEvent.start_date,
        end_date: editEvent.end_date,
        capacity: editEvent.capacity,
        status: editEvent.status,
        image_venue: imageUrl, // ✅ update logo baru
      })
      .eq("id", editEvent.id);

    if (error) {
      console.error("Failed to update event:", error.message);
      return;
    }

    setShowEditModal(false);
    setEditEvent(null);
    setFile(null);
    setPreview(null);

    fetchEvents();
  };

  const columns = [
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
          <button
            onClick={() => handleEditClick(evt)}
            className="bg-blue-600 text-white px-3 py-1 rounded"
          >
            Edit
          </button>
        </div>
      ),
    };
  });

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex justify-between items-center w-full px-6 pt-5">
          <h1 className="text-xl font-bold mb-4">List Event</h1>
          <div className="flex gap-2">
            {/* ✅ Input Search + Button */}
            <input
              type="text"
              placeholder="Search event..."
              className="border rounded px-3 py-2"
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
          ) : (
            <BasicTableOne columns={columns} rows={rows} />
          )}
        </div>
      </div>

      {/* Modal Add & Edit tetap sama */}
      {/* Modal Tambah Event */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-lg font-bold mb-4">Tambah Event</h2>
            <input
              type="text"
              placeholder="Event Name"
              className="w-full border p-2 mb-2"
              value={newEvent.name}
              onChange={(e) =>
                setNewEvent({ ...newEvent, name: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Description"
              className="w-full border p-2 mb-2"
              value={newEvent.description}
              onChange={(e) =>
                setNewEvent({ ...newEvent, description: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Location"
              className="w-full border p-2 mb-2"
              value={newEvent.location}
              onChange={(e) =>
                setNewEvent({ ...newEvent, location: e.target.value })
              }
            />
            <input
              type="date"
              className="w-full border p-2 mb-2"
              value={newEvent.start_date}
              onChange={(e) =>
                setNewEvent({ ...newEvent, start_date: e.target.value })
              }
            />
            <input
              type="date"
              className="w-full border p-2 mb-2"
              value={newEvent.end_date}
              onChange={(e) =>
                setNewEvent({ ...newEvent, end_date: e.target.value })
              }
            />

            <div className="p-2 mb-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full"
              />
              {(preview || newEvent.image_venue) && (
                <div className="flex items-center gap-3 mt-2">
                  <div className="w-16 h-16 relative overflow-hidden border">
                    <Image
                      src={
                        preview ?? newEvent.image_venue ?? "/placeholder.png"
                      }
                      alt="preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="text-sm text-gray-500">Preview</div>
                </div>
              )}
            </div>

            <input
              type="number"
              placeholder="Capacity"
              className="w-full border p-2 mb-2"
              value={newEvent.capacity}
              onChange={(e) =>
                setNewEvent({ ...newEvent, capacity: e.target.value })
              }
            />

            {/* ✅ Select status */}
            <select
              className="w-full border p-2 mb-2"
              value={newEvent.status ? "true" : "false"}
              onChange={(e) =>
                setNewEvent({ ...newEvent, status: e.target.value === "true" })
              }
            >
              <option value="true">Active</option>
              <option value="false">Nonactive</option>
            </select>

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
      )}

      {/* Modal Edit Event */}
      {showEditModal && editEvent && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-lg font-bold mb-4">Edit Event</h2>
            <input
              type="text"
              placeholder="Event Name"
              className="w-full border p-2 mb-2"
              value={editEvent.name || ""}
              onChange={(e) =>
                setEditEvent({ ...editEvent, name: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Description"
              className="w-full border p-2 mb-2"
              value={editEvent.description || ""}
              onChange={(e) =>
                setEditEvent({ ...editEvent, description: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Location"
              className="w-full border p-2 mb-2"
              value={editEvent.location || ""}
              onChange={(e) =>
                setEditEvent({ ...editEvent, location: e.target.value })
              }
            />
            <input
              type="date"
              className="w-full border p-2 mb-2"
              value={editEvent.start_date?.split("T")[0] || ""}
              onChange={(e) =>
                setEditEvent({ ...editEvent, start_date: e.target.value })
              }
            />
            <input
              type="date"
              className="w-full border p-2 mb-2"
              value={editEvent.end_date?.split("T")[0] || ""}
              onChange={(e) =>
                setEditEvent({ ...editEvent, end_date: e.target.value })
              }
            />

            <div className="p-2 mb-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full"
              />

              {(preview || newEvent.image_venue) && (
                <div className="flex items-center gap-3 mt-2">
                  <div className="w-16 h-16 relative overflow-hidden border">
                    <Image
                      src={
                        preview ?? newEvent.image_venue ?? "/placeholder.png"
                      }
                      alt="preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="text-sm text-gray-500">Preview</div>
                </div>
              )}
            </div>

            <input
              type="number"
              placeholder="Capacity"
              className="w-full border p-2 mb-2"
              value={editEvent.capacity || ""}
              onChange={(e) =>
                setEditEvent({
                  ...editEvent,
                  capacity: e.target.value ? parseInt(e.target.value) : null,
                })
              }
            />

            {/* ✅ Select status */}
            <select
              className="w-full border p-2 mb-2"
              value={editEvent.status ? "true" : "false"}
              onChange={(e) =>
                setEditEvent({
                  ...editEvent,
                  status: e.target.value === "true",
                })
              }
            >
              <option value="true">Active</option>
              <option value="false">Nonactive</option>
            </select>

            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-400 text-white rounded"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={handleUpdateEvent}
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
