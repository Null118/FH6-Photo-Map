import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

import type { AuthSession } from "@/types";

const PASSWORD_KEY_LENGTH = 64;

function toBase64Url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

function fromBase64Url(input: string) {
  return Buffer.from(input, "base64url");
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, PASSWORD_KEY_LENGTH).toString("hex");

  return `${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, passwordHash: string) {
  const [salt, storedKey] = passwordHash.split(":");
  if (!salt || !storedKey) {
    return false;
  }

  const derivedKey = scryptSync(password, salt, PASSWORD_KEY_LENGTH);
  const storedBuffer = Buffer.from(storedKey, "hex");

  if (derivedKey.length !== storedBuffer.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, storedBuffer);
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createSessionToken(session: AuthSession, secret: string) {
  const payload = toBase64Url(JSON.stringify(session));
  const signature = sign(payload, secret);

  return `${payload}.${signature}`;
}

export function decodeSessionToken(token: string, secret: string): AuthSession | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = sign(payload, secret);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (actualBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const session = JSON.parse(fromBase64Url(payload).toString("utf8")) as AuthSession;
    if (session.expiresAt <= Date.now()) {
      return null;
    }

    if (!session.userId || !session.username || !session.displayName) {
      return null;
    }

    if (session.role !== "admin" && session.role !== "user") {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export function isAdminSession(session: AuthSession | null) {
  return session?.role === "admin";
}

export type { AuthSession };
