import { hashPassword } from "../src/lib/auth";
import { db } from "../src/lib/db";

async function createSeedUser(input: {
  username: string;
  displayName: string;
  password: string;
  role: "admin" | "user";
}) {
  await db.user.create({
    data: {
      username: input.username,
      displayName: input.displayName,
      passwordHash: hashPassword(input.password),
      role: input.role,
    },
  });
}

async function main() {
  const [existingLocation, existingAdmin, existingUser] = await Promise.all([
    db.location.findFirst(),
    db.user.findUnique({ where: { username: "admin" } }),
    db.user.findUnique({ where: { username: "driver" } }),
  ]);

  if (!existingAdmin) {
    await createSeedUser({
      username: "admin",
      displayName: "地图管理员",
      password: "admin123456",
      role: "admin",
    });
  }

  if (!existingUser) {
    await createSeedUser({
      username: "driver",
      displayName: "普通用户",
      password: "user123456",
      role: "user",
    });
  }

  const admin = existingAdmin ?? (await db.user.findUnique({ where: { username: "admin" } }));

  if (existingLocation) {
    if (admin && !existingLocation.ownerId) {
      await db.location.update({
        where: { id: existingLocation.id },
        data: {
          ownerId: admin.id,
          photos: {
            updateMany: {
              where: {
                ownerId: null,
              },
              data: {
                ownerId: admin.id,
              },
            },
          },
        },
      });
    }

    return;
  }

  await db.location.create({
    data: {
      title: "Volcano Drift Ridge",
      ownerId: admin?.id,
      description: "A seeded sample spot for verifying marker, detail, and admin flows.",
      x: 0.42,
      y: 0.56,
      isPublished: true,
      status: "approved",
      photos: {
        create: {
          title: "Golden Hour Test Shot",
          ownerId: admin?.id,
          description: "Replace this seeded photo with a real local upload later.",
          imagePath: "/uploads/sample-placeholder.svg",
          sortOrder: 0,
          isPublished: true,
          status: "approved",
          cameraBody: "Nikon Zf",
          lens: "24-70mm f/2.8",
          focalLength: "35mm",
          aperture: "f/2.8",
          shutterSpeed: "1/200",
          iso: "100",
          customMeta: [
            {
              key: "Weather",
              value: "Clear",
            },
          ],
        },
      },
    },
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
