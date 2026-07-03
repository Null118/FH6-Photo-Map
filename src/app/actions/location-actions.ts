"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminUser, requireLoggedInUser } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { getResubmissionReviewState } from "@/lib/me-map";
import { saveImageFile } from "@/lib/uploads";
import { locationInputSchema, photoInputSchema } from "@/lib/validators";

function parseCustomMetaField(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") {
    return [];
  }

  return JSON.parse(value);
}

export async function createLocationAction(formData: FormData) {
  const session = await requireLoggedInUser();
  const locationInput = locationInputSchema.parse({
    title: formData.get("title"),
    description: formData.get("description"),
    x: formData.get("x"),
    y: formData.get("y"),
  });

  const photoTitles = formData.getAll("photoTitle");
  const photoDescriptions = formData.getAll("photoDescription");
  const cameraBodies = formData.getAll("cameraBody");
  const lenses = formData.getAll("lens");
  const focalLengths = formData.getAll("focalLength");
  const apertures = formData.getAll("aperture");
  const shutterSpeeds = formData.getAll("shutterSpeed");
  const isos = formData.getAll("iso");
  const shotAts = formData.getAll("shotAt");
  const customMetaRows = formData.getAll("customMeta");
  const imageFiles = formData
    .getAll("image")
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (imageFiles.length === 0) {
    throw new Error("At least one photo is required.");
  }

  const photoCreates = await Promise.all(
    imageFiles.map(async (file, index) => {
      const parsed = photoInputSchema.parse({
        title: photoTitles[index],
        description: photoDescriptions[index],
        cameraBody: cameraBodies[index],
        lens: lenses[index],
        focalLength: focalLengths[index],
        aperture: apertures[index],
        shutterSpeed: shutterSpeeds[index],
        iso: isos[index],
        shotAt: shotAts[index],
        customMeta: parseCustomMetaField(customMetaRows[index] ?? null),
      });

      const imagePath = await saveImageFile(file, parsed.title);

      return {
        ...parsed,
        ownerId: session.userId,
        imagePath,
        sortOrder: index,
        status: "pending" as const,
        isPublished: false,
        shotAt: parsed.shotAt ? new Date(parsed.shotAt) : null,
      };
    }),
  );

  await db.location.create({
    data: {
      ...locationInput,
      ownerId: session.userId,
      status: "pending",
      isPublished: false,
      photos: {
        create: photoCreates,
      },
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/locations");
  revalidatePath("/admin/photos");
  revalidatePath("/me");
  redirect("/me");
}

export async function approveLocationAction(locationId: string) {
  await requireAdminUser();

  await db.location.update({
    where: { id: locationId },
    data: {
      isPublished: true,
      status: "approved",
      photos: {
        updateMany: {
          where: {},
          data: {
            isPublished: true,
            status: "approved",
          },
        },
      },
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/locations");
  revalidatePath("/admin/photos");
  revalidatePath(`/admin/locations/${locationId}`);
  revalidatePath("/me");
}

export async function updateOwnedLocationAction(locationId: string, formData: FormData) {
  const session = await requireLoggedInUser();
  const existingLocation = await db.location.findFirst({
    where: {
      id: locationId,
      ownerId: session.userId,
    },
    select: {
      id: true,
      x: true,
      y: true,
      photos: {
        select: {
          id: true,
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!existingLocation) {
    throw new Error("Location not found or not owned by current user.");
  }

  const locationInput = locationInputSchema.parse({
    title: formData.get("title"),
    description: formData.get("description"),
    x: existingLocation.x,
    y: existingLocation.y,
  });
  const photoIds = formData.getAll("photoId");
  const photoTitles = formData.getAll("photoTitle");
  const photoDescriptions = formData.getAll("photoDescription");
  const cameraBodies = formData.getAll("cameraBody");
  const lenses = formData.getAll("lens");
  const focalLengths = formData.getAll("focalLength");
  const apertures = formData.getAll("aperture");
  const shutterSpeeds = formData.getAll("shutterSpeed");
  const isos = formData.getAll("iso");
  const shotAts = formData.getAll("shotAt");
  const customMetaRows = formData.getAll("customMeta");
  const ownedPhotoIds = new Set(existingLocation.photos.map((photo) => photo.id));
  const reviewState = getResubmissionReviewState();

  await db.$transaction(async (tx) => {
    await tx.location.update({
      where: { id: existingLocation.id },
      data: {
        title: locationInput.title,
        description: locationInput.description,
        ...reviewState,
      },
    });

    await tx.photo.updateMany({
      where: {
        locationId: existingLocation.id,
      },
      data: reviewState,
    });

    for (const [index, photoIdValue] of photoIds.entries()) {
      if (typeof photoIdValue !== "string" || !ownedPhotoIds.has(photoIdValue)) {
        throw new Error("Photo not found or not owned by current user.");
      }

      const parsed = photoInputSchema.parse({
        title: photoTitles[index],
        description: photoDescriptions[index],
        cameraBody: cameraBodies[index],
        lens: lenses[index],
        focalLength: focalLengths[index],
        aperture: apertures[index],
        shutterSpeed: shutterSpeeds[index],
        iso: isos[index],
        shotAt: shotAts[index],
        customMeta: parseCustomMetaField(customMetaRows[index] ?? null),
      });

      await tx.photo.update({
        where: {
          id: photoIdValue,
        },
        data: {
          ...parsed,
          ...reviewState,
          shotAt: parsed.shotAt ? new Date(parsed.shotAt) : null,
        },
      });
    }
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/locations");
  revalidatePath("/admin/photos");
  revalidatePath("/admin/review/locations");
  revalidatePath("/admin/review/photos");
  revalidatePath("/me");
  revalidatePath(`/me/locations/${locationId}`);
  redirect("/me");
}

export async function approvePhotoAction(photoId: string) {
  await requireAdminUser();

  const photo = await db.photo.update({
    where: { id: photoId },
    data: {
      isPublished: true,
      status: "approved",
    },
    select: {
      locationId: true,
    },
  });

  await db.location.update({
    where: { id: photo.locationId },
    data: {
      isPublished: true,
      status: "approved",
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/locations");
  revalidatePath("/admin/photos");
  revalidatePath("/admin/review/locations");
  revalidatePath("/admin/review/photos");
  revalidatePath(`/admin/locations/${photo.locationId}`);
  revalidatePath("/me");
}

export async function deleteLocationAction(locationId: string) {
  await requireAdminUser();

  await db.location.delete({
    where: { id: locationId },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/locations");
  revalidatePath("/admin/photos");
  revalidatePath("/admin/review/locations");
  revalidatePath("/admin/review/photos");
  revalidatePath("/me");
}

export async function deletePhotoAction(photoId: string) {
  await requireAdminUser();

  const photo = await db.photo.delete({
    where: { id: photoId },
    select: {
      locationId: true,
    },
  });

  const remainingPhotoCount = await db.photo.count({
    where: {
      locationId: photo.locationId,
    },
  });

  if (remainingPhotoCount === 0) {
    await db.location.delete({
      where: { id: photo.locationId },
    });
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/locations");
  revalidatePath("/admin/photos");
  revalidatePath("/admin/review/locations");
  revalidatePath("/admin/review/photos");
  revalidatePath(`/admin/locations/${photo.locationId}`);
  revalidatePath("/me");
}
