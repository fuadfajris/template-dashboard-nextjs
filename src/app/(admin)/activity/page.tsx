"use client";

import BasicTableOne from "@/components/table/BasicTableOne";
import { useUser } from "@/context/UserContext";
import { useEffect, useState } from "react";

type ActivityItem = {
  id: string;
  activity_id: string;
  content_key: string;
  content: string;
  maker: string;
  approver?: string;
  status: string;
  created_at: string;
  updated_at?: string;
  approved_at?: string | null;
};

export default function ActivityPage() {
  const { user } = useUser();
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchActivity = async () => {
    if (!user?.merchant_id || !user.token) return;

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/activity`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user?.token}`,
      },
    });

    if (!res.ok) {
      console.error("Failed to fetch activity:", res.status, res.statusText);
      return;
    }
    const result = await res.json();
    const data = Array.isArray(result) ? result : [];
    setActivity(data);
    setLoading(false);
  };

  const handleUpdateStatus = async (
    id: string,
    status: "approved" | "rejected"
  ) => {
    if (!user?.token) return;

    const now = new Date().toISOString();
    const body = {
      status,
      approver: {
        id: user.id,
        name: user.name,
        email: user.email,
        roleId: user.role_id,
      },
      updated_at: now,
      approved_at: status === "approved" ? now : null,
    };

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/activity/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        console.error("Failed to update status:", res.statusText);
        return;
      }

      // update state lokal
      setActivity((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status,
                approver: JSON.stringify({
                  id: user.id,
                  name: user.name,
                  email: user.email,
                  roleId: user.role_id,
                }),
                updated_at: now,
                approved_at: status === "approved" ? now : null,
              }
            : item
        )
      );
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const columns: {
    key: "index" | "contentKey" | "status" | "action";
    label: string;
  }[] = [
    { key: "index", label: "No" },
    { key: "contentKey", label: "Content Key" },
    { key: "status", label: "Status" },
    { key: "action", label: "Action" },
  ];

  const rows = activity.map((evt, idx) => ({
    index: idx + 1,
    contentKey: evt.content_key || "-",
    status: evt.status,
    action: (
      <div className="flex gap-2">
        {evt.status !== "rejected" &&
          evt.status !== "approved" &&
          user?.role_id == 2 && (
            <button
              className="bg-green-600 text-white px-3 py-1 rounded"
              onClick={() => handleUpdateStatus(evt.id, "approved")}
            >
              Approve
            </button>
          )}
        {evt.status !== "rejected" &&
          evt.status !== "approved" &&
          user?.role_id === 2 && (
            <button
              className="bg-red-600 text-white px-3 py-1 rounded"
              onClick={() => handleUpdateStatus(evt.id, "rejected")}
            >
              Reject
            </button>
          )}

        {evt.status !== "rejected" &&
          evt.status !== "approved" &&
          user?.role_id === 2 && (
            <button className="bg-red-600 text-white px-3 py-1 rounded">
              Cancel
            </button>
          )}
      </div>
    ),
  }));

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-col md:flex-row justify-between items-center w-full px-6 pt-5">
        <h1 className="text-xl font-bold mb-4 text-gray-800 dark:text-white/90">
          List Activity
        </h1>
      </div>

      <div className="px-6 py-5">
        {loading ? (
          <p>Loading...</p>
        ) : activity.length === 0 ? (
          <p className="text-gray-500">Tidak ada activity</p>
        ) : (
          <BasicTableOne columns={columns} rows={rows} />
        )}
      </div>
    </div>
  );
}
