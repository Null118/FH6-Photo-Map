import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { hashPassword } from "../src/lib/auth";
import { db } from "../src/lib/db";
import {
  buildDemoLocationDrafts,
  extractForzaImageUrls,
  FH6_DEMO_LOCATION_COUNT,
  FH6_DEMO_TITLE_PREFIX,
  selectDemoImageUrls,
} from "../src/lib/fh6-demo-seed";

const driverUsername = "driver";
const driverPassword = "user123456";
const driverDisplayName = "普通用户";
const uploadsDirectory = path.join(process.cwd(), "public", "uploads");
const forzaPayloadUrls = [
  "https://forza.net/news/_payload.json?7656f64d-a90b-4a40-ae9a-b375b158aade",
  "https://forza.net/media/_payload.json?7656f64d-a90b-4a40-ae9a-b375b158aade",
  "https://forza.net/forzahorizon6/_payload.json?7656f64d-a90b-4a40-ae9a-b375b158aade",
];

async function main() {
  const driver = await db.user.upsert({
    where: {
      username: driverUsername,
    },
    create: {
      username: driverUsername,
      displayName: driverDisplayName,
      passwordHash: hashPassword(driverPassword),
      role: "user",
    },
    update: {
      displayName: driverDisplayName,
      role: "user",
    },
  });

  await clearExistingDemoData(driver.id);

  const sourceUrls = selectDemoImageUrls(await fetchForzaImageUrls(), FH6_DEMO_LOCATION_COUNT);
  const drafts = buildDemoLocationDrafts(sourceUrls);

  await mkdir(uploadsDirectory, { recursive: true });

  for (const draft of drafts) {
    const imagePath = await downloadImage(draft.sourceUrl, draft.localFileBaseName);
    const location = await db.location.create({
      data: {
        ownerId: driver.id,
        title: draft.location.title,
        description: draft.location.description,
        x: draft.location.x,
        y: draft.location.y,
        isPublished: draft.location.isPublished,
        status: draft.location.status,
        photos: {
          create: {
            ownerId: driver.id,
            title: draft.photo.title,
            description: draft.photo.description,
            imagePath,
            sortOrder: draft.photo.sortOrder,
            isPublished: draft.photo.isPublished,
            status: draft.photo.status,
            cameraBody: draft.photo.cameraBody,
            lens: draft.photo.lens,
            focalLength: draft.photo.focalLength,
            aperture: draft.photo.aperture,
            shutterSpeed: draft.photo.shutterSpeed,
            iso: draft.photo.iso,
            customMeta: draft.photo.customMeta,
          },
        },
      },
      include: {
        photos: true,
      },
    });

    const coverPhotoId = location.photos[0]?.id;
    if (coverPhotoId) {
      await db.location.update({
        where: {
          id: location.id,
        },
        data: {
          coverPhotoId,
        },
      });
    }

    console.log(`${draft.location.title}: ${draft.location.status} ${imagePath}`);
  }

  const [approvedLocations, pendingLocations, approvedPhotos, pendingPhotos] = await Promise.all([
    db.location.count({
      where: {
        ownerId: driver.id,
        title: {
          startsWith: FH6_DEMO_TITLE_PREFIX,
        },
        status: "approved",
        isPublished: true,
      },
    }),
    db.location.count({
      where: {
        ownerId: driver.id,
        title: {
          startsWith: FH6_DEMO_TITLE_PREFIX,
        },
        status: "pending",
        isPublished: false,
      },
    }),
    db.photo.count({
      where: {
        ownerId: driver.id,
        location: {
          title: {
            startsWith: FH6_DEMO_TITLE_PREFIX,
          },
        },
        status: "approved",
        isPublished: true,
      },
    }),
    db.photo.count({
      where: {
        ownerId: driver.id,
        location: {
          title: {
            startsWith: FH6_DEMO_TITLE_PREFIX,
          },
        },
        status: "pending",
        isPublished: false,
      },
    }),
  ]);

  console.log(
    `Seeded ${approvedLocations + pendingLocations} locations and ${approvedPhotos + pendingPhotos} photos for ${driverUsername}.`,
  );
  console.log(
    `Locations: ${approvedLocations} approved, ${pendingLocations} pending. Photos: ${approvedPhotos} approved, ${pendingPhotos} pending.`,
  );
}

async function fetchForzaImageUrls() {
  const payloads = await Promise.all(
    forzaPayloadUrls.map(async (url) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
      }

      return response.text();
    }),
  );

  return payloads.flatMap(extractForzaImageUrls);
}

async function clearExistingDemoData(ownerId: string) {
  const locations = await db.location.findMany({
    where: {
      ownerId,
      title: {
        startsWith: FH6_DEMO_TITLE_PREFIX,
      },
    },
    include: {
      photos: true,
    },
  });

  await db.location.deleteMany({
    where: {
      id: {
        in: locations.map((location) => location.id),
      },
    },
  });

  await Promise.all(
    locations
      .flatMap((location) => location.photos)
      .map((photo) => removeLocalUpload(photo.imagePath)),
  );
}

async function downloadImage(url: string, localFileBaseName: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }

  const extension = getImageExtension(url, response.headers.get("content-type"));
  const filename = `${localFileBaseName}.${extension}`;
  const destination = path.join(uploadsDirectory, filename);
  const buffer = Buffer.from(await response.arrayBuffer());

  await writeFile(destination, buffer);

  return `/uploads/${filename}`;
}

function getImageExtension(url: string, contentType: string | null) {
  const extension = url.split(".").pop()?.toLowerCase();
  if (extension === "jpg" || extension === "jpeg" || extension === "png" || extension === "webp") {
    return extension === "jpeg" ? "jpg" : extension;
  }

  if (contentType?.includes("webp")) return "webp";
  if (contentType?.includes("png")) return "png";

  return "jpg";
}

async function removeLocalUpload(imagePath: string) {
  if (!imagePath.startsWith("/uploads/fh6-demo-")) {
    return;
  }

  await rm(path.join(process.cwd(), "public", imagePath), {
    force: true,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
