import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { uploadBuffer } from "@/lib/storage";

/**
 * Local-fallback upload endpoint. With S3 configured the client uploads via a
 * presigned URL instead and never hits this route. Host-authenticated only.
 */
export async function PUT(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });

  const contentType = req.headers.get("content-type") ?? "application/octet-stream";
  const buffer = Buffer.from(await req.arrayBuffer());
  if (buffer.byteLength > 200 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large" }, { status: 413 });
  }

  const publicUrl = await uploadBuffer(key, buffer, contentType);
  return NextResponse.json({ publicUrl });
}
