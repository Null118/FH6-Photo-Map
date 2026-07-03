import "server-only";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import slugify from "slugify";

import { getImageUploadSizeError } from "@/lib/upload-constraints";

const uploadsDirectory = path.join(process.cwd(), "public", "uploads");
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

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

  await ensureUploadsDirectory();

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safePrefix = slugify(prefix, { lower: true, strict: true }) || "photo";
  const filename = `${Date.now()}-${safePrefix}.${extension}`;
  const destination = path.join(uploadsDirectory, filename);
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(destination, buffer);

  return `/uploads/${filename}`;
}
