import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { uploadBuffer } from "@/lib/storage";
import { rateLimit } from "@/lib/ratelimit";
import { nanoid } from "nanoid";

const MAX_BYTES = 8 * 1024 * 1024;

/** Public, rate-limited image upload for guest issue reports (images only). */
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
  if (!rateLimit(`gupload:${ip}`, 10, 60_000).ok) {
    return NextResponse.json({ error: "Too many uploads." }, { status: 429 });
  }

  const property = await db.property.findUnique({
    where: { slug },
    select: { id: true, isPublished: true },
  });
  if (!property || !property.isPublished) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data." }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof Blob)) return NextResponse.json({ error: "No file." }, { status: 400 });
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Images only." }, { status: 415 });
  }
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Image too large." }, { status: 413 });

  const ext = file.type.split("/")[1] ?? "jpg";
  const key = `guest-reports/${property.id}/${nanoid(10)}.${ext}`;
  const publicUrl = await uploadBuffer(key, Buffer.from(await file.arrayBuffer()), file.type);
  return NextResponse.json({ publicUrl });
}
