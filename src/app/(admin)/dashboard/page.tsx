"use client";

import GenderComparisonChart from "@/components/admin/GenderComparisonChart";
import MonthlySalesChart from "@/components/admin/MonthlySalesChart";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import BasicTableOne from "@/components/table/BasicTableOne";
import { useUser } from "@/context/UserContext";
import { BoxIconLine, ChevronDownIcon, TicketIcon } from "@/icons";
import { supabase } from "@/lib/supabase";
import { ApexOptions } from "apexcharts";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";

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

type TicketCategoryCount = {
  [category: string]: number;
};

type TicketsDashboard = {
  totalTickets: number;
  ticketsPerCategory: TicketCategoryCount;
  labels: string[];
  series: number[];
};

type TicketItem = {
  quantity: number;
  ticket: { ticket_type: string };
  order: { status: string; event_id: number };
};

export default function DashboardPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  const [eventList, setEventList] = useState<EventOption[]>([]);
  const [eventId, setEventId] = useState("");
  const [ordersDashboard, setOrdersDashboard] = useState<OrdersDashboard>({
    totalOrders: 0,
    recentOrders: [],
  });
  const [ticketsDashboard, setTicketsDashboard] = useState<TicketsDashboard>({
    totalTickets: 0,
    ticketsPerCategory: {},
    labels: [],
    series: [],
  });

  const [checkinSeries, setCheckinSeries] = useState<number[]>([0, 0, 0]);
  const [countCheckin, setCountCheckin] = useState(0);
  const [salesChart, setSalesChart] = useState<number[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [genderCategories, setGenderCategories] = useState<string[]>([]);
  const [maleData, setMaleData] = useState<number[]>([]);
  const [femaleData, setFemaleData] = useState<number[]>([]);

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
      const { data, error } = await supabase
        .from("events")
        .select("id, name")
        .eq("merchant_id", user.id);

      if (!error && data) {
        setEventList(data.map((e) => ({ value: e.id, label: e.name })));
      }
    };
    fetchEvents();
  }, [user]);

  // fetch order & ticket
  useEffect(() => {
    if (!user?.id || !eventId) return;

    const fetchOrder = async () => {
      const { data, count, error } = await supabase
        .from("orders")
        .select(
          `
            *,
            user:users (
              name,
              email,
              phone
            ),
            event:events (
              start_date
            )
          `,
          { count: "exact" }
        )
        .eq("status", "paid")
        .eq("event_id", eventId)
        .order("order_date", { ascending: true })
        .limit(5);

      if (!error && data) {
        const eventDate = new Date(data[0].event.start_date);
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

        let cat: string[] = [];
        for (let i = 2; i >= 0; i--) {
          const d = new Date(eventYear, eventMonth - i, 1);
          cat.push(monthNames[d.getMonth()]);
        }
        setCategories(cat);

        const monthCounts = Array(3).fill(0);
        data.forEach((item: any) => {
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
      }
    };

    const fetchTicket = async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select(
          `
            quantity,
            ticket: tickets ( ticket_type ),
            order: orders!inner ( status, event_id )
          `
        )
        .eq("order.status", "paid")
        .eq("order.event_id", eventId)
        .returns<TicketItem[]>();

      if (!error && data) {
        const ticketsPerCategory: Record<string, number> = {};
        let totalTickets = 0;

        (data as TicketItem[]).forEach((item) => {
          const type = item.ticket.ticket_type;
          const qty = item.quantity;

          totalTickets += qty;
          ticketsPerCategory[type] = (ticketsPerCategory[type] || 0) + qty;
        });
        const labels = Object.keys(ticketsPerCategory);
        const series = Object.values(ticketsPerCategory);

        setTicketsDashboard({
          totalTickets,
          ticketsPerCategory,
          labels,
          series: labels.map(() => 0),
        });

        setTimeout(() => {
          setTicketsDashboard({
            totalTickets,
            ticketsPerCategory,
            labels,
            series,
          });
        }, 300);
      }
    };

    // utils buat generate range tanggal
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

    const fetchGenderComparison = async () => {
      // 1. Ambil info event untuk tahu start & end date
      const { data: event, error: eventErr } = await supabase
        .from("events")
        .select("start_date, end_date")
        .eq("id", eventId)
        .single();

      if (eventErr || !event) return;

      // 2. Generate semua tanggal event
      const categories = getDateRange(event.start_date, event.end_date);

      // 3. Ambil ticket_details via orders -> order_items
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
      id,
      event_id,
      ticket_details (
        id,
        event_date,
        gender
      )
    `
        )
        .eq("event_id", eventId);

      if (error || !data) return;

      // 4. Buat grouped default = 0
      const grouped: Record<string, { male: number; female: number }> = {};
      categories.forEach((date) => {
        grouped[date] = { male: 0, female: 0 };
      });

      // 5. Isi dari ticket_details
      data.forEach((order) => {
        order.ticket_details?.forEach((td) => {
          const date = new Date(td.event_date).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
          });

          if (grouped[date]) {
            if (td.gender?.toLowerCase() === "male") grouped[date].male++;
            if (td.gender?.toLowerCase() === "female") grouped[date].female++;
          }
        });
      });

      // 6. Convert ke array chart
      const maleCounts = categories.map((d) => grouped[d].male);
      const femaleCounts = categories.map((d) => grouped[d].female);

      setGenderCategories(categories);
      setMaleData(maleCounts);
      setFemaleData(femaleCounts);
    };

    fetchOrder();
    fetchTicket();
    fetchGenderComparison();
  }, [user, eventId]);

  // count checkin (jalan setelah totalTickets keisi)
  useEffect(() => {
    if (!user?.id || !eventId) return;

    const countCheckin = async () => {
      const { data, error } = await supabase
        .from("checkins")
        .select(
          `
    checked_in_at,
    ticket_details:ticket_details!inner(
      gender,
      orders:orders!inner(
        event_id
      )
    )
  `
        )
        .not("checked_in_at", "is", null)
        .eq("ticket_details.orders.event_id", eventId);

      if (!error && data) {
        let maleCount = 0;
        let femaleCount = 0;

        data.forEach((item) => {
          const td = Array.isArray(item.ticket_details)
            ? item.ticket_details[0]
            : item.ticket_details;

          const gender = td?.gender;
          if (gender?.toLowerCase() === "male") maleCount++;
          else if (gender?.toLowerCase() === "female") femaleCount++;
        });

        const notCheckin =
          ticketsDashboard.totalTickets - (maleCount + femaleCount);

        setCheckinSeries([maleCount, femaleCount, notCheckin]);
        setCountCheckin(maleCount + femaleCount);
      }
    };

    countCheckin();
  }, [ticketsDashboard.totalTickets]);

  const options: ApexOptions = {
    labels: ["Male", "Female", "Not Checkin"],
    colors: ["#3b82f6", "#ec4899", "#999999"],
    plotOptions: {
      pie: {
        startAngle: -90,
        endAngle: 90,
        offsetY: 10,
      },
    },
    grid: {
      padding: { bottom: -100 },
    },
    legend: {
      position: "bottom",
      horizontalAlign: "center",
      fontSize: "14px",
    },
  };

  const chartOptions: ApexOptions = {
    labels: ticketsDashboard.labels,
    dataLabels: {
      enabled: true,
      formatter: function (val) {
        return Number(val).toFixed(0) + "%";
      },
    },
    legend: {
      position: "bottom",
      horizontalAlign: "center",
      fontSize: "14px",
    },
  };

  const columns = [
    { key: "index", label: "No" },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "date", label: "Date" },
  ];

  const rows = ordersDashboard.recentOrders.map((entry, idx) => ({
    index: idx + 1,
    name: entry.user.name,
    email: entry.user.email,
    phone: entry.user.phone,
    date: entry.order_date.split("T")[0],
  }));

  return (
    <>
      {/* Pilih Event */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] mb-5">
        <div className="w-full md:w-1/2 px-6 py-5">
          <Label>Pilih Event</Label>
          <div className="relative">
            <Select
              options={eventList}
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

      {/* Metric + Chart */}
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7 flex flex-col justify-between">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
            {/* Order */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
                <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
              </div>
              <div className="flex items-end justify-between mt-5">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Total Order
                  </span>
                  <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                    {ordersDashboard.totalOrders}
                  </h4>
                </div>
              </div>
            </div>

            {/* Tiket Terjual */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
                <TicketIcon className="text-gray-800 dark:text-white/90" />
              </div>
              <div className="flex items-end justify-between mt-5">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Total Tickets Sold
                  </span>
                  <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                    {ticketsDashboard.totalTickets}
                  </h4>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
            <MonthlySalesChart
              salesChart={salesChart}
              categories={categories}
            />

            <GenderComparisonChart
              categories={genderCategories}
              maleData={maleData}
              femaleData={femaleData}
            />
          </div>
        </div>

        {/* Checkin */}
        <div className="col-span-12 xl:col-span-5">
          <div className="h-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="h-full items-center px-5 py-5 bg-white shadow-default rounded-2xl dark:bg-gray-900 sm:px-6 sm:py-6">
              <div className="text-left">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  Checkin by gender
                </h3>
              </div>
              <ReactApexChart
                key={checkinSeries.join("-")}
                options={options}
                series={checkinSeries}
                type="donut"
                height={250}
              />

              <div className="mt-6 text-center text-sm text-gray-500">
                Congratulations! There are {countCheckin} attendees who have
                already checked in from {ticketsDashboard.totalTickets} ticket.
                Keep up the great work!
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart Card */}
        <div className="rounded-2xl border border-gray-200 p-4 lg:p-6 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
            Ticket Type
          </h3>
          <ReactApexChart
            key={ticketsDashboard.series.join("-")}
            options={chartOptions}
            series={ticketsDashboard.series}
            type="donut"
          />
        </div>

        {/* Table Card */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 p-4 lg:p-6 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
            Recent Order
          </h3>
          <BasicTableOne columns={columns} rows={rows} />
        </div>
      </div>
    </>
  );
}
