"use client";

import { useUser } from "@/context/UserContext";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";

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

const componentMap: Record<string, any> = {
  event: dynamic(() => import("@/app/(admin)/activity/EventDetail")),
};

export default function ActivityDetailPage() {
  const { user } = useUser();
  const params = useParams();
  const router = useRouter();
  const [activity, setActivity] = useState<ActivityItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivityDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchActivityDetail = async () => {
    if (!user?.token || !params.id) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/activity/${params.id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (!res.ok) {
        console.error("Failed to fetch activity:", res.statusText);
        return;
      }

      const data: ActivityItem = await res.json();
      setActivity(data);
    } catch (error) {
      console.error("Error fetching activity:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!activity) return <p className="text-gray-500">Activity not found</p>;

  const ActivityComponent =
    componentMap[activity.content_key?.toLowerCase() ?? ""] ??
    dynamic(() => import("@/app/(admin)/activity/DefaultActivityDetail"));

  const approver = activity.approver ? JSON.parse(activity.approver) : null;

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow">
      <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
        Activity Detail
      </h1>

      <ActivityComponent
        data={activity.content ? JSON.parse(activity.content) : {}}
      />

      <div className="mt-6 space-y-2">
        <p>
          <strong>Maker:</strong> {activity.maker}
        </p>
        <p>
          <strong>Status:</strong> {activity.status}
        </p>
        <p>
          <strong>Approver:</strong>{" "}
          {approver ? `${approver.name} (${approver.email})` : "-"}
        </p>
      </div>

      <button
        className="mt-4 bg-gray-500 text-white px-4 py-2 rounded"
        onClick={() => router.back()}
      >
        Back
      </button>
    </div>
  );
}
