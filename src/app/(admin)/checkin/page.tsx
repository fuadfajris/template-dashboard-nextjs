"use client";

import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import BasicTableOne from "@/components/table/BasicTableOne";
import { useUser } from "@/context/UserContext";
import { Html5QrcodeScanner } from "html5-qrcode";
import { ChevronDownIcon } from "lucide-react";
import { useEffect, useState } from "react";

type EventOption = { value: string; label: string };

export default function ScanPage() {
  const { user } = useUser();
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [eventList, setEventList] = useState<EventOption[]>([]);
  const [eventId, setEventId] = useState("");
  const [checkins, setCheckins] = useState<any[]>([]);
  const [loading, setLoading] = useState(false); // ✅ state loading

  const handleScan = async (data: string | null) => {
    if (!data) return;

    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        body: JSON.stringify({ id: data }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(result.error || "Gagal check-in");
      } else {
        setStatus("success");
        setMessage(`Check-in berhasil: ${result.name}`);
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMessage("Terjadi kesalahan sistem.");
    }
  };

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: 250 },
      false
    );

    scanner.render(handleScan, (err) => {
      console.error("QR Scan error:", err);
    });

    return () => {
      scanner.clear().catch(console.error);
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchEvents = async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/events/merchant/${user.id}`,
        {
          headers: {
            "Content-Type": "application/json",
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

      setEventList(formattedEvents);
      setEventId(data.length !== 0 ? data[0].id : "");
    };

    fetchEvents();
  }, [user]);

  useEffect(() => {
    if (!eventId) return;

    const fetchCheckins = async () => {
      setLoading(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/checkins/all-checkins?event_id=${eventId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );

      setLoading(false);

      if (!res.ok) {
        console.error("Failed to fetch events:", res.status, res.statusText);
        return;
      }
      const data = await res.json();

      setCheckins(data || []);
    };

    fetchCheckins();
  }, [eventId]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Scan QR Code</h1>
      <div
        id="qr-reader"
        className="rounded-2xl border !border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
        style={{ width: "400px" }}
      />

      {status !== "idle" && (
        <div
          className={`mt-4 p-4 rounded-lg ${
            status === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      <div className="py-5">
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] mb-5">
          <div className="w-full md:w-1/2 px-6 py-5">
            <Label>Select an event</Label>
            <div className="relative">
              <Select
                options={eventList}
                defaultValue={eventId}
                placeholder="Select Option"
                onChange={setEventId}
                className="dark:bg-dark-900"
              />
              <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                <ChevronDownIcon />
              </span>
            </div>
          </div>

          <div className="px-6 py-5">
            {loading ? (
              <div className="text-center py-10 text-gray-500">
                Loading data...
              </div>
            ) : (
              <BasicTableOne
                columns={[
                  { key: "index", label: "No" },
                  { key: "name", label: "Name" },
                  { key: "email", label: "Email" },
                  { key: "phone", label: "Phone" },
                  { key: "checkin", label: "Checkin" },
                ]}
                rows={(checkins || []).map((c, idx) => ({
                  index: idx + 1,
                  name: c.ticket_detail.name ?? "-",
                  email: c.ticket_detail.email ?? "-",
                  phone: c.ticket_detail.phone ?? "-",
                  checkin: c.checked_in_at?.split("T")[0] ?? "-",
                }))}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
