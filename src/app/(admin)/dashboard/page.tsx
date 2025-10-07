"use client";

import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import { useUser } from "@/context/UserContext";
import { ChevronDownIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type EventOption = { value: string; label: string };

type User = {
  name: string;
  email: string;
  phone: string;
};

type Order = {
  id: string;
  user_id: string;
  event_id: string;
  order_date: string;
  status: "pending" | "paid" | "cancelled";
  user: User;
};

type OrdersDashboard = {
  totalOrders: number;
  recentOrders: Order[];
};

export default function DashboardPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  const [eventList, setEventList] = useState<EventOption[]>([]);
  const [eventId, setEventId] = useState("");
  const [salesChart, setSalesChart] = useState<number[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [ordersDashboard, setOrdersDashboard] = useState<OrdersDashboard>({
    totalOrders: 0,
    recentOrders: [],
  });

  useEffect(() => {
    document.title = "Dashboard - MyApp";
  }, []);

  // proteksi user
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  // ambil list event
  useEffect(() => {
    if (!user?.id) return;
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

  // fetch order & ticket
  useEffect(() => {
    if (!user?.id || !eventId) return;

    function getDateRange(start: string, end: string) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const dates: string[] = [];

      while (startDate <= endDate) {
        dates.push(
          startDate.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
          })
        );
        startDate.setDate(startDate.getDate() + 1);
      }

      return dates;
    }

    const fetchOrder = async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/order-transactions?event_id=${eventId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );

      if (!res.ok) {
        console.error("Failed to fetch order:", res.status, res.statusText);
        return;
      }

      const data = await res.json();
      const count = data.length;

      // SALES AND ORDER

      const eventDate = data.length
        ? new Date(data[0].event.start_date)
        : new Date();
      const eventMonth = eventDate.getMonth();
      const eventYear = eventDate.getFullYear();

      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      const cat: string[] = [];
      for (let i = 2; i >= 0; i--) {
        const d = new Date(eventYear, eventMonth - i, 1);
        cat.push(monthNames[d.getMonth()]);
      }
      setCategories(cat);

      const monthCounts = Array(3).fill(0);
      data.forEach((item: Order) => {
        const date = new Date(item.order_date);
        const m = date.getMonth();
        const y = date.getFullYear();

        cat.forEach((c, idx) => {
          if (y === eventYear && monthNames[m] === c) {
            monthCounts[idx]++;
          }
        });
      });

      setSalesChart(monthCounts);
      setOrdersDashboard({
        totalOrders: count ?? 0,
        recentOrders: data as Order[],
      });
    };

    fetchOrder();
  }, [user, eventId]);

  return (
    <>
      {/* Pilih Event */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] mb-5">
        <div className="w-full md:w-1/2 px-6 py-5">
          <Label>Pilih Event</Label>
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
      </div>

      <div>Test</div>
    </>
  );
}
