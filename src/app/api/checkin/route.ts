import { useUser } from "@/context/UserContext";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { user } = useUser();

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/checkins`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${user?.token}`,
    },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    console.error("Failed to fetch events:", res.status, res.statusText);
    return;
  }
  const data = await res.json();

  return NextResponse.json({
    success: true,
    message: "Checkin Success",
    data: data,
  });
}
