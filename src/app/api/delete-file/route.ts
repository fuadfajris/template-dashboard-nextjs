import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  try {
    const { filePath } = await req.json();
    if (!filePath) {
      return NextResponse.json(
        { error: "File path required" },
        { status: 400 }
      );
    }

    const absolutePath = path.join(process.cwd(), "public", filePath);

    // cek file exist dulu
    try {
      await fs.stat(absolutePath);
      await fs.unlink(absolutePath);
    } catch {
      // kalau file nggak ada, biarin aja
      console.warn("File not found, skip delete:", absolutePath);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
