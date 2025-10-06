import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase"; // atau sesuaikan path-nya

export async function POST(req: Request) {
  const { id } = await req.json();

  const { data: participant, error } = await supabase
    .from("checkins")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !participant) {
    return NextResponse.json(
      { error: "Peserta tidak ditemukan" },
      { status: 404 }
    );
  }

  if (participant.checked_in) {
    return NextResponse.json(
      { error: "Peserta sudah check-in" },
      { status: 400 }
    );
  }

  const { error: updateError } = await supabase
    .from("checkins")
    .update({
      checked_in_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json(
      { error: "Gagal update check-in" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, message: "Checkin Success" });
}
