import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env, features } from "@/lib/env";

/**
 * S3-compatible storage with a local-filesystem fallback for development.
 * Production uploads should use signed URLs straight to S3; the local mode
 * stores files under /public/uploads and serves them directly.
 */

let s3: S3Client | null = null;
function getS3(): S3Client | null {
  if (!features.s3) return null;
  if (!s3) {
    s3 = new S3Client({
      region: env.s3.region,
      endpoint: env.s3.endpoint,
      credentials: {
        accessKeyId: env.s3.accessKeyId,
        secretAccessKey: env.s3.secretAccessKey,
      },
      forcePathStyle: true,
    });
  }
  return s3;
}

function publicUrlFor(key: string): string {
  if (features.s3) {
    const base = env.s3.publicUrl || `${env.s3.endpoint}/${env.s3.bucket}`;
    return `${base.replace(/\/$/, "")}/${key}`;
  }
  return `/uploads/${key}`;
}

const LOCAL_DIR = path.join(process.cwd(), "public", "uploads");

export async function uploadBuffer(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  const client = getS3();
  if (client) {
    await client.send(
      new PutObjectCommand({
        Bucket: env.s3.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
    return publicUrlFor(key);
  }

  // Local fallback
  const dest = path.join(LOCAL_DIR, key);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, body);
  return publicUrlFor(key);
}

/**
 * Returns an upload target for the client. With S3 configured this is a
 * presigned PUT URL; otherwise it points at our local upload route handler.
 */
export async function createUploadTarget(
  key: string,
  contentType: string,
): Promise<{ mode: "s3" | "local"; uploadUrl: string; publicUrl: string }> {
  const client = getS3();
  if (client) {
    const uploadUrl = await getSignedUrl(
      client,
      new PutObjectCommand({ Bucket: env.s3.bucket, Key: key, ContentType: contentType }),
      { expiresIn: 600 },
    );
    return { mode: "s3", uploadUrl, publicUrl: publicUrlFor(key) };
  }
  return {
    mode: "local",
    uploadUrl: `/api/upload?key=${encodeURIComponent(key)}`,
    publicUrl: publicUrlFor(key),
  };
}

export function buildMediaKey(orgId: string, propertyId: string, fileName: string): string {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const stamp = Math.abs(hashString(`${propertyId}:${safe}`)).toString(36);
  return `${orgId}/${propertyId}/${stamp}-${safe}`;
}

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return h;
}
