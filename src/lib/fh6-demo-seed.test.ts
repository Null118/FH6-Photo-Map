import { describe, expect, it } from "vitest";

import {
  buildDemoLocationDrafts,
  extractForzaImageUrls,
  getForzaSceneKey,
  selectDemoImageUrls,
} from "@/lib/fh6-demo-seed";

describe("FH6 demo seed helpers", () => {
  it("extracts escaped Forza CDN image URLs from Nuxt payload text", () => {
    const payload =
      '["https:\\u002F\\u002Fcdn.forza.net\\u002Fstrapi-uploads\\u002Fassets\\u002Flarge_Forza_Horizon6_Launch_01_City_Neon_16x9_59c37c6bd9.jpg","https:\\u002F\\u002Fcdn.forza.net\\u002Fstrapi-uploads\\u002Fassets\\u002Flogo_xbox.svg"]';

    expect(extractForzaImageUrls(payload)).toEqual([
      "https://cdn.forza.net/strapi-uploads/assets/large_Forza_Horizon6_Launch_01_City_Neon_16x9_59c37c6bd9.jpg",
    ]);
  });

  it("normalizes size variants to the same scene key", () => {
    expect(
      getForzaSceneKey(
        "https://cdn.forza.net/strapi-uploads/assets/medium_Forza_Horizon6_Launch_03_Hirosaki_Castle_16x9_WM_405a5941e3.webp",
      ),
    ).toBe("Forza_Horizon6_Launch_03_Hirosaki_Castle_16x9");
  });

  it("selects one image per scene before using official variants to fill the requested count", () => {
    const urls = [
      "https://cdn.forza.net/strapi-uploads/assets/small_Forza_Horizon6_Launch_01_City_Neon_16x9_aaaa111111.jpg",
      "https://cdn.forza.net/strapi-uploads/assets/large_Forza_Horizon6_Launch_01_City_Neon_16x9_bbbb222222.jpg",
      "https://cdn.forza.net/strapi-uploads/assets/medium_Forza_Horizon6_Preview_04_Offroad_Autumn_16x9_cccc333333.webp",
      "https://cdn.forza.net/strapi-uploads/assets/large_Forza_Horizon6_Preview_04_Offroad_Autumn_16x9_dddd444444.jpg",
      "https://cdn.forza.net/strapi-uploads/assets/large_Forza_Horizon6_Pre_Order_10_Mt_Fuji_Vista_16x9_eeee555555.jpg",
    ];

    const selected = selectDemoImageUrls(urls, 4);

    expect(selected).toHaveLength(4);
    expect(new Set(selected.map(getForzaSceneKey)).size).toBe(3);
    expect(selected.map((url) => url.includes("large_"))).toEqual([true, true, true, false]);
  });

  it("builds 50 deterministic driver-owned drafts with a 40 approved and 10 pending split", () => {
    const imageUrls = Array.from({ length: 50 }, (_, index) => {
      const serial = String(index + 1).padStart(2, "0");
      return `https://cdn.forza.net/strapi-uploads/assets/large_Forza_Horizon6_Demo_${serial}_16x9_${serial.repeat(5)}.jpg`;
    });

    const drafts = buildDemoLocationDrafts(imageUrls);

    expect(drafts).toHaveLength(50);
    expect(drafts.filter((draft) => draft.location.status === "approved")).toHaveLength(40);
    expect(drafts.filter((draft) => draft.location.status === "pending")).toHaveLength(10);
    expect(drafts.filter((draft) => draft.photo.status === "approved")).toHaveLength(40);
    expect(drafts.filter((draft) => draft.photo.status === "pending")).toHaveLength(10);
    expect(drafts.every((draft) => draft.location.isPublished === (draft.location.status === "approved"))).toBe(
      true,
    );
    expect(drafts.every((draft) => draft.photo.isPublished === (draft.photo.status === "approved"))).toBe(true);
    expect(drafts.every((draft) => draft.location.x >= 0.06 && draft.location.x <= 0.94)).toBe(true);
    expect(drafts.every((draft) => draft.location.y >= 0.08 && draft.location.y <= 0.92)).toBe(true);
    expect(drafts[0].location.title).toBe("FH6 Demo Spot 001");
    expect(drafts[49].localFileBaseName).toBe("fh6-demo-050");
  });
});
