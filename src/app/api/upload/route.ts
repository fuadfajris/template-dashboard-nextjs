import { NextResponse } from "next/server";
import { writeFile, mkdir, readFile } from "fs/promises";
import path from "path";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "";
    const templateId = formData.get("template_id") as string | null;
    const scope = formData.get("scope") as string;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large (max 2MB)" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = `${Date.now()}-${file.name}`;
    formData.append("filename", fileName);

    let remoteUrl: string | null = null;

    // 🟢 1. Upload ke remote dulu
    if (scope === "event" && templateId) {
      const { data: template, error } = await supabase
        .from("templates")
        .select("url")
        .eq("id", templateId)
        .single();

      if (error) {
        console.error("Fetch template url failed:", error.message);
      } else if (template?.url) {
        const remoteRes = await fetch(`${template.url}api/upload`, {
          method: "POST",
          body: formData,
        });

        if (!remoteRes.ok) {
          const text = await remoteRes.text();
          throw new Error(`Remote upload failed: ${text}`);
        }

        const remoteJson = await remoteRes.json();
        remoteUrl = remoteJson.url ?? null;
      }
    }

    // 🟢 2. Kalau remote berhasil → simpan ke lokal
    const uploadDir = path.join(process.cwd(), `public/uploads/${folder}`);
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    const localUrl = `/uploads/${folder}/${fileName}`;

    return NextResponse.json({
      url: localUrl,
      remote: remoteUrl,
    });
  } catch (err: unknown) {
    console.error("Upload error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const file = searchParams.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file specified" }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), "public", file);
    const ext = path.extname(file).toLowerCase();

    let contentType = "application/octet-stream";
    if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    if (ext === ".png") contentType = "image/png";
    if (ext === ".gif") contentType = "image/gif";
    if (ext === ".webp") contentType = "image/webp";

    const buffer = await readFile(filePath);
    const uint8Array = new Uint8Array(buffer);

    return new NextResponse(uint8Array, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (err: unknown) {
    console.error("GET error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Failed to fetch image", details: message },
      { status: 500 }
    );
  }
}
