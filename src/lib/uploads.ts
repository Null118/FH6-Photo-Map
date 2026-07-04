import "server-only";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import slugify from "slugify";

import { getImageUploadSizeError } from "@/lib/upload-constraints";

const uploadsDirectory = path.join(process.cwd(), "public", "uploads");
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

type StorageConfig = {
  supabaseUrl: string;
  serviceRoleKey: string;
  bucket: string;
  publicUrl: string;
};

export async function ensureUploadsDirectory() {
  await mkdir(uploadsDirectory, { recursive: true });
}

export function isImageFile(file: File) {
  return file.size > 0 && allowedMimeTypes.has(file.type);
}

export async function saveImageFile(file: File, prefix: string) {
  if (!isImageFile(file)) {
    throw new Error("Only JPG, PNG, WEBP, and GIF image uploads are supported.");
  }

  const sizeError = getImageUploadSizeError(file.name, file.size);
  if (sizeError) {
    throw new Error(sizeError);
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safePrefix = slugify(prefix, { lower: true, strict: true }) || "photo";
  const filename = `${Date.now()}-${safePrefix}.${extension}`;
  const objectPath = `uploads/${filename}`;
  const storageConfig = getStorageConfig();

  if (storageConfig) {
    return uploadToSupabaseStorage(file, objectPath, storageConfig);
  }

  await ensureUploadsDirectory();

  const destination = path.join(uploadsDirectory, filename);
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(destination, buffer);

  return `/uploads/${filename}`;
}

function getStorageConfig(): StorageConfig | null {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET;
  const publicUrl = process.env.SUPABASE_STORAGE_PUBLIC_URL;

  if (!supabaseUrl && !serviceRoleKey && !bucket && !publicUrl) {
    return null;
  }

  if (!supabaseUrl || !serviceRoleKey || !bucket || !publicUrl) {
    throw new Error(
      "Supabase Storage is partially configured. Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_STORAGE_BUCKET, and SUPABASE_STORAGE_PUBLIC_URL.",
    );
  }

  return {
    supabaseUrl: supabaseUrl.replace(/\/$/, ""),
    serviceRoleKey,
    bucket,
    publicUrl: publicUrl.replace(/\/$/, ""),
  };
}

async function uploadToSupabaseStorage(file: File, objectPath: string, config: StorageConfig) {
  const uploadUrl = `${config.supabaseUrl}/storage/v1/object/${config.bucket}/${objectPath}`;
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      authorization: `Bearer ${config.serviceRoleKey}`,
      apikey: config.serviceRoleKey,
      "cache-control": "3600",
      "content-type": file.type || "application/octet-stream",
      "x-upsert": "false",
    },
    body: Buffer.from(await file.arrayBuffer()),
  });

  if (!response.ok) {
    throw new Error(`Failed to upload image to Supabase Storage: ${response.status} ${response.statusText}`);
  }

  return `${config.publicUrl}/${objectPath}`;
}
