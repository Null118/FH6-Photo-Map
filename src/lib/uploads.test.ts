import { afterEach, describe, expect, it, vi } from "vitest";

import { saveImageFile } from "@/lib/uploads";

vi.mock("server-only", () => ({}));

function createImageFile(name = "FH6 Demo Shot.JPG") {
  return new File(["demo-image"], name, {
    type: "image/jpeg",
  });
}

describe("uploads", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("uploads to Supabase Storage when deployment storage is configured", async () => {
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
    vi.stubEnv("SUPABASE_STORAGE_BUCKET", "fh6-photos");
    vi.stubEnv(
      "SUPABASE_STORAGE_PUBLIC_URL",
      "https://example.supabase.co/storage/v1/object/public/fh6-photos",
    );
    vi.spyOn(Date, "now").mockReturnValue(1783000000000);

    const fetchMock = vi.fn(async () => new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(saveImageFile(createImageFile(), "Neon Ridge")).resolves.toBe(
      "https://example.supabase.co/storage/v1/object/public/fh6-photos/uploads/1783000000000-neon-ridge.jpg",
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.supabase.co/storage/v1/object/fh6-photos/uploads/1783000000000-neon-ridge.jpg",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          authorization: "Bearer service-role-key",
          "content-type": "image/jpeg",
        }),
      }),
    );
  });
});
