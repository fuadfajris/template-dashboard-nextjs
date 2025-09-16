import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { supabase } from "@/lib/supabase";

interface RemoteDeleteResponse {
  success: boolean;
  message?: string;
  [key: string]: unknown;
}

export async function POST(req: Request) {
  try {
    const { filePath, scope, templateId } = await req.json();

    if (!filePath) {
      return NextResponse.json(
        { error: "File path required" },
        { status: 400 }
      );
    }

    const absolutePath = path.join(process.cwd(), "public", filePath);

    let remoteResult: RemoteDeleteResponse | null = null;
    if (scope === "event" && templateId) {
      const { data: template, error } = await supabase
        .from("templates")
        .select("url")
        .eq("id", templateId)
        .single();

      if (error) {
        throw new Error("Fetch template url failed: " + error.message);
      }

      if (template?.url) {
        try {
          const remoteRes = await fetch(`${template.url}api/delete-file`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filePath }),
          });

          if (!remoteRes.ok) {
            const errMsg = await remoteRes.text();
            throw new Error(`Remote delete failed: ${errMsg}`);
          }

          remoteResult = (await remoteRes.json()) as RemoteDeleteResponse;
        } catch (err) {
          console.error("Remote delete request error:", err);
          const message = err instanceof Error ? err.message : String(err);
          return NextResponse.json(
            { error: "Remote delete failed: " + message },
            { status: 500 }
          );
        }
      }
    }

    // ✅ Kalau remote aman → hapus file lokal
    try {
      await fs.stat(absolutePath);
      await fs.unlink(absolutePath);
      console.log("Local file deleted:", absolutePath);
    } catch {
      console.warn("File not found locally, skip delete:", absolutePath);
    }

    return NextResponse.json({
      success: true,
      remote: remoteResult,
    });
  } catch (err) {
    console.error("Delete error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
