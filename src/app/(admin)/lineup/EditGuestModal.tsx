"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/context/UserContext";

// GuestInfo sesuai Page
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

// GuestItem sesuai Page
type GuestItem = {
  id: string;
  guest_id: string;
  event_id: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  stage: string;
  guest: GuestInfo;
};

export default function EditGuestModal({
  eventId,
  guest,
  open,
  onClose,
  onUpdated,
}: {
  eventId: string | null;
  guest: GuestItem | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const { user } = useUser();
  const [form, setForm] = useState<GuestItem | null>(guest);
  const [eventRange, setEventRange] = useState<{
    start: string;
    end: string;
  } | null>(null);

  useEffect(() => {
    if (!open || !guest) return;
    setForm(guest);

    // fetch event range kalau ada event_id
    const fetchEventRange = async () => {
      if (!eventId) return;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/events?event_id=${eventId}&merchant_id=${user?.id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );

      if (res.ok) {
        const result = await res.json();
        const data = result;

        setEventRange({
          start: data.start_date,
          end: data.end_date,
        });
      }
    };

    fetchEventRange();
  }, [eventId, guest, open]);

  const handleChange = (field: keyof GuestItem, value: string) => {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSubmit = async () => {
    if (!form?.id) return;

    const req = {
      schedule_date: form.schedule_date,
      start_time: form.start_time,
      end_time: form.end_time,
      stage: form.stage,
    };

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/guests/lineup/${form.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify(req),
      }
    );

    if (!res.ok) {
      console.error(
        "Failed to update lineup schedule:",
        res.status,
        res.statusText
      );
      return;
    }

    onUpdated();
    onClose();
  };

  const isChanged = useMemo(() => {
    if (!guest || !form) return false;
    return (
      guest.schedule_date !== form.schedule_date ||
      guest.start_time !== form.start_time ||
      guest.end_time !== form.end_time ||
      guest.stage !== form.stage
    );
  }, [guest, form]);

  const formatDate = (date: string | undefined) => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  if (!open || !form) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 dark:bg-white/25">
      <div className="w-full max-w-4xl p-6 rounded-lg bg-primary/5 bg-white dark:bg-gray-800">
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
          Edit Lineup Schedule
        </h2>

        {/* Lineup info (non-editable) */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-800 dark:text-white">
            Lineup
          </label>
          <input
            type="text"
            value={form.guest.name}
            disabled
            className="w-full border p-2 text-gray-800 dark:text-white rounded-lg"
          />
        </div>

        {/* Date */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-800 dark:text-white">
            Date
          </label>
          <input
            type="date"
            value={form?.schedule_date}
            min={formatDate(eventRange?.start)}
            max={formatDate(eventRange?.end)}
            onChange={(e) => handleChange("schedule_date", e.target.value)}
            className="w-full border p-2 rounded-lg bg-input"
          />
        </div>

        {/* Start & End Time */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-800 dark:text-white">
              Start Time
            </label>
            <input
              type="time"
              value={form.start_time}
              onChange={(e) => handleChange("start_time", e.target.value)}
              className="w-full border p-2 rounded-lg bg-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-800 dark:text-white">
              End Time
            </label>
            <input
              type="time"
              value={form.end_time}
              onChange={(e) => handleChange("end_time", e.target.value)}
              className="w-full border p-2 rounded-lg bg-input"
            />
          </div>
        </div>

        {/* Stage */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-800 dark:text-white">
            Stage
          </label>
          <input
            type="text"
            value={form.stage}
            onChange={(e) => handleChange("stage", e.target.value)}
            className="w-full border p-2 rounded-lg bg-input"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isChanged}
            className={`px-4 py-2 rounded text-white ${
              !isChanged
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
