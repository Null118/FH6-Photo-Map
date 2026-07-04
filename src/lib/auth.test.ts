import { describe, expect, it, vi } from "vitest";

import {
  createSessionToken,
  decodeSessionToken,
  hashPassword,
  isAdminSession,
  verifyPassword,
  type AuthSession,
} from "@/lib/auth";
import { getAuthSecret } from "@/lib/auth-server";

vi.mock("server-only", () => ({}));

const AUTH_SECRET = "fh6-photo-map-test-secret";

describe("auth helpers", () => {
  it("hashes passwords and verifies the matching plain text", () => {
    const passwordHash = hashPassword("test-password");

    expect(passwordHash).not.toBe("test-password");
    expect(verifyPassword("test-password", passwordHash)).toBe(true);
    expect(verifyPassword("wrong-password", passwordHash)).toBe(false);
  });

  it("creates signed session tokens that round-trip the minimum user payload", () => {
    const session: AuthSession = {
      userId: "user_123",
      role: "admin",
      username: "map-admin",
      displayName: "Map Admin",
      expiresAt: Date.now() + 60_000,
    };

    const token = createSessionToken(session, AUTH_SECRET);

    expect(decodeSessionToken(token, AUTH_SECRET)).toEqual(session);
  });

  it("returns null for tampered or malformed session tokens", () => {
    const session: AuthSession = {
      userId: "user_456",
      role: "user",
      username: "driver",
      displayName: "Driver",
      expiresAt: Date.now() + 60_000,
    };

    const token = createSessionToken(session, AUTH_SECRET);

    expect(decodeSessionToken(`${token}tampered`, AUTH_SECRET)).toBeNull();
    expect(decodeSessionToken("bad-token", AUTH_SECRET)).toBeNull();
  });

  it("returns null for expired sessions", () => {
    const session: AuthSession = {
      userId: "user_789",
      role: "user",
      username: "expired",
      displayName: "Expired User",
      expiresAt: Date.now() - 1_000,
    };

    const token = createSessionToken(session, AUTH_SECRET);

    expect(decodeSessionToken(token, AUTH_SECRET)).toBeNull();
  });

  it("recognizes admin sessions by role only", () => {
    expect(
      isAdminSession({
        userId: "admin_1",
        role: "admin",
        username: "admin",
        displayName: "Admin",
        expiresAt: Date.now() + 10_000,
      }),
    ).toBe(true);

    expect(
      isAdminSession({
        userId: "user_1",
        role: "user",
        username: "user",
        displayName: "User",
        expiresAt: Date.now() + 10_000,
      }),
    ).toBe(false);

    expect(isAdminSession(null)).toBe(false);
  });

  it("requires an explicit auth secret in production", () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalAuthSecret = process.env.AUTH_SECRET;

    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AUTH_SECRET", "");

    expect(() => getAuthSecret()).toThrow("AUTH_SECRET must be set in production.");

    vi.stubEnv("NODE_ENV", originalNodeEnv);
    vi.stubEnv("AUTH_SECRET", originalAuthSecret);
  });
});
