import "server-only";

import { db } from "@/lib/db";
import type { UserRole } from "@/types";

export type UserRecord = {
  id: string;
  username: string;
  displayName: string;
  passwordHash: string;
  role: UserRole;
};

export async function findUserByUsername(username: string) {
  return db.user.findUnique({
    where: { username },
  });
}

export async function findUserById(id: string) {
  return db.user.findUnique({
    where: { id },
  });
}

export async function createUserRecord(input: Omit<UserRecord, "id"> & { id?: string }) {
  return db.user.create({
    data: input,
  });
}
