import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { decodeSessionToken, createSessionToken, isAdminSession } from "@/lib/auth";
import { findUserById } from "@/lib/user-store";
import type { AuthSession } from "@/types";

const SESSION_COOKIE_NAME = "fh6_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;

export function getAuthSecret() {
  const authSecret = process.env.AUTH_SECRET;

  if (authSecret) {
    return authSecret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET must be set in production.");
  }

  return "fh6-photo-map-dev-secret";
}

function getSessionExpiryDate() {
  return new Date(Date.now() + SESSION_DURATION_MS);
}

export async function createLoginSession(session: Omit<AuthSession, "expiresAt">) {
  const expiresAt = getSessionExpiryDate();
  const token = createSessionToken(
    {
      ...session,
      expiresAt: expiresAt.getTime(),
    },
    getAuthSecret(),
  );

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function clearLoginSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  return decodeSessionToken(token, getAuthSecret());
}

export async function getCurrentUser() {
  const session = await getCurrentSession();
  if (!session) {
    return null;
  }

  return findUserById(session.userId);
}

export async function requireLoggedInUser() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function requireAdminUser() {
  const session = await getCurrentSession();
  if (!isAdminSession(session)) {
    redirect("/admin/login");
  }

  return session;
}
