"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";

type Guest = {
  id: string;
  name: string;
  email: string;
  phone: string;
  stage: string;
  start_time: string;
  end_time: string;
  schedule_date: string;
  schedule_id?: string;
};

export default function EditGuestModal({
  eventId,
  guest,
  open,
  onClose,
  onUpdated,
}: {
  eventId: string | null;
  guest: Guest | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [form, setForm] = useState<Guest | null>(guest);
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

      const { data, error } = await supabase
        .from("events")
        .select("start_date, end_date")
        .eq("id", eventId)
        .single();

      if (error) {
        console.error("Failed to fetch event range:", error.message);
        return;
      }

      if (data) {
        setEventRange({
          start: data.start_date,
          end: data.end_date,
        });
      }
    };

    fetchEventRange();
  }, [eventId, guest, open]);

  const handleChange = (field: keyof Guest, value: string) => {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSubmit = async () => {
    if (!form?.schedule_id) return;

    const { error } = await supabase
      .from("guest_schedules")
      .update({
        schedule_date: form.schedule_date,
        start_time: form.start_time,
        end_time: form.end_time,
        stage: form.stage,
      })
      .eq("id", form.schedule_id);

    if (error) {
      console.error("Failed to update lineup schedule:", error.message);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Edit Lineup Schedule</h2>

        {/* Lineup info (non-editable) */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600">
            Lineup
          </label>
          <input
            type="text"
            value={`${form.name}`}
            disabled
            className="w-full border p-2 rounded bg-gray-100 text-gray-600"
          />
        </div>

        {/* Date */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600">
            Date
          </label>
          <input
            type="date"
            value={form?.schedule_date}
            min={formatDate(eventRange?.start)}
            max={formatDate(eventRange?.end)}
            onChange={(e) => handleChange("schedule_date", e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Start & End Time */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-600">
              Start Time
            </label>
            <input
              type="time"
              value={form.start_time}
              onChange={(e) => handleChange("start_time", e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">
              End Time
            </label>
            <input
              type="time"
              value={form.end_time}
              onChange={(e) => handleChange("end_time", e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>
        </div>

        {/* Stage */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600">
            Stage
          </label>
          <input
            type="text"
            value={form.stage}
            onChange={(e) => handleChange("stage", e.target.value)}
            className="w-full border p-2 rounded"
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
