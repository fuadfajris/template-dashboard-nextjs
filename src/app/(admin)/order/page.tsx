"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/context/UserContext";
import BasicTableOne from "@/components/table/BasicTableOne";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import { ChevronDownIcon } from "lucide-react";
import dynamic from "next/dynamic";

type EventOption = { value: string; label: string };

type Order = {
  id: string;
  order_date: string;
  status: string;
  quantity: number;
  price: number;
  user: {
    name: string;
    email: string;
    phone: string;
  };
};

type TicketDetailRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  ticketType: string;
  price: number | null;
  status: string | null;
  checkedInAt: string | null;
};

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export default function OrderPage() {
  const { user } = useUser();
  const [eventList, setEventList] = useState<EventOption[]>([]);
  const [eventId, setEventId] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailRows, setDetailRows] = useState<TicketDetailRow[]>([]);

  // Ambil list event merchant
  useEffect(() => {
    if (!user) return;

    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, name")
        .eq("merchant_id", user.id)
        .order("id", { ascending: true });

      if (error) {
        console.error("Error fetching events:", error.message);
        return;
      }

      setEventList(
        (data || []).map((e) => ({
          value: e.id,
          label: e.name,
        }))
      );
      setEventId(data.length !== 0 ? data[0].id : "");
    };

    fetchEvents();
  }, [user]);

  const fetchOrder = useCallback(
    async (search?: string) => {
      if (!eventId) return;
      setLoadingOrders(true);

      // Ambil semua orders dengan relasi users
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
        id,
        order_date,
        status,
        quantity,
        price,
        users (
          name,
          email,
          phone
        )
      `
        )
        .eq("event_id", eventId)
        .order("order_date", { ascending: true });

      setLoadingOrders(false);

      if (error) {
        console.error("Supabase error:", error.message);
        return;
      }

      if (data) {
        // Mapping hasil orders
        let mapped: Order[] = data.map((o: any) => ({
          id: o.id,
          order_date: o.order_date,
          status: o.status,
          quantity: o.quantity,
          price: o.price,
          user: {
            name: o.users?.name ?? "-",
            email: o.users?.email ?? "-",
            phone: o.users?.phone ?? "-",
          },
        }));

        // 🔍 Filtering di client-side
        if (search && search.trim() !== "") {
          const term = search.trim().toLowerCase();
          mapped = mapped.filter(
            (o) =>
              o.user.name.toLowerCase().includes(term) ||
              o.user.email.toLowerCase().includes(term) ||
              o.user.phone.toLowerCase().includes(term)
          );
        }

        setOrders(mapped);
      }
    },
    [eventId]
  );

  // Auto fetch ketika event berubah
  useEffect(() => {
    if (eventId) fetchOrder();
  }, [eventId, fetchOrder]);

  const handleDetailClick = async (order: Order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
    setLoadingDetail(true);
    setDetailRows([]);

    const { data, error } = await supabase
      .from("ticket_details")
      .select(
        `
        id,
        name,
        email,
        phone,
        gender,
        ticket_status,
        order:orders!inner(
          id,
          tickets:ticket_id(
            ticket_type,
            price
          )
        ),
        checkins(
          id,
          checked_in_at
        )
      `
      )
      // filter berdasarkan order id yang sedang dipilih
      .eq("order.id", order.id);

    if (error) {
      console.error("Supabase detail error:", error.message);
      setLoadingDetail(false);
      return;
    }

    // Rapikan bentuk data untuk tabel
    const rows: TicketDetailRow[] = (data || []).map((td: any) => {
      const oi = Array.isArray(td.order) ? td.order[0] : td.order;
      const ticketType =
        oi?.tickets?.ticket_type ??
        (Array.isArray(oi?.tickets) ? oi?.tickets?.[0]?.ticket_type : "-");

      // relasi checkins biasanya 0..1 (ambil yang pertama bila array)
      const checkedInAt = Array.isArray(td.checkins)
        ? td.checkins[0]?.checked_in_at ?? null
        : td.checkins?.checked_in_at ?? null;

      return {
        id: String(td.id),
        name: td.name ?? "-",
        email: td.email ?? "-",
        phone: td.phone ?? "-",
        gender: td.gender ?? "-",
        ticketType: ticketType ?? "-",
        price: typeof oi?.tickets.price === "number" ? oi.tickets.price : null,
        status: td.ticket_status ?? null,
        checkedInAt: checkedInAt,
      };
    });

    setDetailRows(rows);
    setLoadingDetail(false);
  };

  const chartData = useMemo(() => {
    if (!orders || orders.length === 0)
      return { categories: [], qty: [], price: [] };

    return {
      categories: orders.map((o) => o.order_date.split("T")[0]),
      qty: orders.map((o) => Math.floor(o.quantity ?? 0)),
      price: orders.map((o) => o.price ?? 0),
    };
  }, [orders]);

  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: "line",
      toolbar: { show: false },
    },
    stroke: { curve: "smooth" },
    xaxis: {
      categories: chartData.categories,
      title: { text: "Order Date" },
    },
    yaxis: [
      {
        title: { text: "Quantity" },
      },
      {
        opposite: true,
        title: { text: "Total Price" },
      },
    ],
    tooltip: {
      shared: true,
      intersect: false,
    },
    legend: {
      position: "top",
    },
  };

  const series = [
    {
      name: "Quantity",
      data: chartData.qty,
    },
    {
      name: "Total Price",
      data: chartData.price,
    },
  ];

  return (
    <div className="px-6 py-5">
      {/* Select Event */}
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
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] mb-5">
        <h1 className="text-xl font-bold px-6 pt-5 text-gray-800 dark:text-white/90">
          Order Trend
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 px-6 py-5">
          <div className="md:col-span-4">
            <ReactApexChart
              options={chartOptions}
              series={series}
              type="line"
              height={250}
            />
          </div>

          <div className="md:col-span-2 overflow-x-auto pb-4">
            <div className="flex md:flex-col flex-row gap-4 md:gap-4 flex-nowrap">
              <div className="rounded-xl p-4 bg-gray-50 dark:bg-gray-900/30 shadow-sm flex-1 min-w-[180px]">
                <p className="text-sm text-gray-400">Total Orders</p>
                <p className="text-xl font-bold text-gray-800 dark:text-white/90">
                  {orders.length}
                </p>
              </div>

              <div className="rounded-xl p-4 bg-[#465FFF]/10 shadow-sm flex-1 min-w-[180px]">
                <p className="text-sm text-gray-400">Total Quantity</p>
                <p className="text-xl font-bold text-[#465FFF]">
                  {orders.reduce((acc, o) => acc + o.quantity, 0)}
                </p>
              </div>

              <div className="rounded-xl p-4 bg-[#2ECC71]/10 shadow-sm flex-1 min-w-[180px]">
                <p className="text-sm text-gray-400">Total Revenue</p>
                <p className="text-xl font-bold text-[#2ECC71]">
                  Rp{" "}
                  {orders
                    .reduce((acc, o) => acc + o.price, 0)
                    .toLocaleString("id-ID")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] mb-5 px-6 py-5">
        {/* Search */}
        {eventId && (
          <div className="flex flex-col md:flex-row gap-2 mb-4">
            <input
              type="text"
              placeholder="Search by name/email/phone..."
              className="border rounded px-3 py-2 border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] text-gray-800 dark:text-white/90"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") fetchOrder(searchTerm);
              }}
            />
            <button
              onClick={() => fetchOrder(searchTerm)}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Search
            </button>
            <button
              onClick={() => {
                setSearchTerm("");
                fetchOrder();
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded"
            >
              Reset
            </button>
          </div>
        )}

        {/* Table */}
        {loadingOrders ? (
          <p>Loading orders...</p>
        ) : (
          <BasicTableOne
            columns={[
              { key: "index", label: "No" },
              { key: "name", label: "Name" },
              { key: "email", label: "Email" },
              { key: "phone", label: "Phone" },
              { key: "quantity", label: "Quantity" },
              { key: "price", label: "Price" },
              { key: "date", label: "Date" },
              { key: "action", label: "Action" },
            ]}
            rows={(orders || []).map((o, idx) => ({
              index: idx + 1,
              name: o.user?.name ?? "-",
              email: o.user?.email ?? "-",
              phone: o.user?.phone ?? "-",
              quantity: o?.quantity ?? "-",
              price: o?.price ?? "-",
              date: o.order_date?.split("T")[0] ?? "-",
              action: (
                <button
                  onClick={() => handleDetailClick(o)}
                  className="px-2 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
                >
                  Detail
                </button>
              ),
            }))}
          />
        )}
      </div>

      {isDetailOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsDetailOpen(false)}
          />
          <div className="relative z-10 w-[95vw] max-w-5xl rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Detail Order
              </h2>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="rounded px-2 py-1 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-white/90"
              >
                Close
              </button>
            </div>

            <div className="mt-2 text-sm text-gray-800 dark:text-gray-400">
              Order Date: {selectedOrder?.order_date.split("T")[0]}
            </div>

            <div className="mt-4">
              {loadingDetail ? (
                <p className="text-sm text-gray-800 dark:text-wrap/90">
                  Loading details...
                </p>
              ) : detailRows.length === 0 ? (
                <p className="text-sm text-gray-800 dark:text-white/90">
                  No ticket details available.
                </p>
              ) : (
                <BasicTableOne
                  columns={[
                    { key: "no", label: "No" },
                    { key: "name", label: "Holder's Name" },
                    { key: "email", label: "Email" },
                    { key: "phone", label: "Phone" },
                    { key: "gender", label: "Gender" },
                    { key: "ticketType", label: "Ticket Type" },
                    { key: "price", label: "Price" },
                    { key: "status", label: "Ticket Status" },
                    { key: "checkin", label: "Check-in At" },
                  ]}
                  rows={detailRows.map((d, i) => ({
                    no: i + 1,
                    name: d.name,
                    email: d.email,
                    phone: d.phone,
                    gender: d.gender,
                    ticketType: d.ticketType,
                    price: d.price,
                    status: d.status ?? "-",
                    checkin: d.checkedInAt?.split("T")[0] ?? "-",
                  }))}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
