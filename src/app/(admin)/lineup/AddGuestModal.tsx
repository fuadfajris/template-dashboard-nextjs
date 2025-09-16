"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type Guest = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

export default function AddGuestModal({
  eventId,
  onAdded,
}: {
  eventId: string;
  onAdded: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [selectedGuest, setSelectedGuest] = useState("");
  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [stage, setStage] = useState("");
  const [eventRange, setEventRange] = useState<{
    start: string;
    end: string;
  } | null>(null);

  // Fetch daftar guest untuk dropdown
  useEffect(() => {
    if (!isOpen) return;
    const fetchGuests = async () => {
      const { data, error } = await supabase
        .from("guests")
        .select("id, name, email, phone");
      if (!error && data) setGuests(data);
    };
    fetchGuests();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchEvent = async () => {
      const { data, error } = await supabase
        .from("events")
        .select("start_date, end_date")
        .eq("id", eventId)
        .single();

      if (!error && data) {
        setEventRange({
          start: data.start_date,
          end: data.end_date,
        });
      }
    };

    if (eventId) fetchEvent();
  }, [eventId, isOpen]);

  const handleSubmit = async () => {
    if (!selectedGuest || !date || !start || !end) return;

    const { error } = await supabase.from("guest_schedules").insert([
      {
        event_id: eventId,
        guest_id: selectedGuest,
        schedule_date: date,
        start_time: start,
        end_time: end,
        stage,
      },
    ]);

    if (error) {
      console.error("Failed to add lineup:", error.message);
      return;
    }

    // ✅ refresh parent list
    onAdded();

    // reset form + close modal
    setSelectedGuest("");
    setDate("");
    setStart("");
    setEnd("");
    setStage("");
    setIsOpen(false);
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.value;
    const minDate = formatDate(eventRange?.start);
    const maxDate = formatDate(eventRange?.end);

    if (selected < minDate || selected > maxDate) {
      alert(`Tanggal harus dalam rentang ${minDate} sampai ${maxDate}`);
      return;
    }
    setDate(selected);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
      >
        + Add Lineup
      </button>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setIsOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md p-6 bg-white rounded-2xl shadow-lg">
                <Dialog.Title className="text-lg font-medium text-gray-900">
                  Add Lineup to Schedule
                </Dialog.Title>

                {/* Dropdown Lineup */}
                <div className="mt-4">
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Lineup
                  </label>
                  <select
                    value={selectedGuest}
                    onChange={(e) => setSelectedGuest(e.target.value)}
                    className="w-full border rounded-lg p-2"
                  >
                    <option value="">-- Select --</option>
                    {guests.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div className="mt-4">
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    min={formatDate(eventRange?.start)}
                    max={formatDate(eventRange?.end)}
                    onChange={handleDateChange}
                    className="w-full border rounded-lg p-2"
                  />
                </div>

                {/* Start & End */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={start}
                      onChange={(e) => setStart(e.target.value)}
                      className="w-full border rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={end}
                      onChange={(e) => setEnd(e.target.value)}
                      onBlur={(e) => e.target.blur()}
                      className="w-full border rounded-lg p-2"
                    />
                  </div>
                </div>

                {/* Stage */}
                <div className="mt-4">
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Stage
                  </label>
                  <input
                    type="text"
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    className="w-full border rounded-lg p-2"
                    placeholder="e.g. Main Stage"
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm text-gray-700 bg-gray-200 rounded-lg"
                    onClick={() => setIsOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
