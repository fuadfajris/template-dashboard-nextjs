import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { supabase } from "@/lib/supabase";

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
    try {
      await fs.stat(absolutePath); 
      await fs.unlink(absolutePath);
    } catch {
      console.warn("File not found locally, skip delete:", absolutePath);
    }

    let remoteResult: any = null;
    if (scope === "event" && templateId) {
      const { data: template, error } = await supabase
        .from("templates")
        .select("url")
        .eq("id", templateId)
        .single();

      if (error) {
        console.error("Fetch template url failed:", error.message);
      } else if (template?.url) {
        
        try {
          const remoteRes = await fetch(`${template.url}api/delete-file`, {
            method: "POST", 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filePath }),
          });

          if (remoteRes.ok) {
            remoteResult = await remoteRes.json();
          } else {
            console.error("Remote delete failed:", await remoteRes.text());
          }
        } catch (err: any) {
          console.error("Remote delete request error:", err.message);
        }
      }
    }

    return NextResponse.json({
      success: true,
      remote: remoteResult,
    });
  } catch (err: any) {
    console.error("Delete error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
