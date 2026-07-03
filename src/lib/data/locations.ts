import "server-only";

import { db } from "@/lib/db";
import type { LocationMapItem } from "@/types";

export async function getPublishedMapLocations(): Promise<LocationMapItem[]> {
  const items = await db.location.findMany({
    where: {
      isPublished: true,
    },
    include: {
      photos: {
        where: {
          isPublished: true,
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return items.map((item) => ({
    id: item.id,
    title: item.title,
    x: item.x,
    y: item.y,
    isPublished: item.isPublished,
    status: item.status,
    coverImagePath: item.photos[0]?.imagePath ?? null,
    photoCount: item.photos.length,
  }));
}

export async function getLocationDetail(id: string) {
  return db.location.findUnique({
    where: { id },
    include: {
      photos: {
        where: {
          isPublished: true,
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });
}

export async function getAllLocationsForAdmin() {
  return db.location.findMany({
    include: {
      owner: true,
      photos: {
        include: {
          owner: true,
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

export async function getPendingLocationsForAdmin() {
  return db.location.findMany({
    where: {
      status: "pending",
    },
    include: {
      owner: true,
      photos: {
        include: {
          owner: true,
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

export async function getAllPhotosForAdmin() {
  return db.photo.findMany({
    include: {
      location: true,
      owner: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

export async function getPendingPhotosForAdmin() {
  return db.photo.findMany({
    where: {
      status: "pending",
    },
    include: {
      location: {
        include: {
          owner: true,
        },
      },
      owner: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

export async function getLocationsForOwner(ownerId: string) {
  return db.location.findMany({
    where: {
      ownerId,
    },
    include: {
      photos: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

export async function getEditableLocationForOwner(locationId: string, ownerId: string) {
  return db.location.findFirst({
    where: {
      id: locationId,
      ownerId,
    },
    include: {
      photos: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });
}
