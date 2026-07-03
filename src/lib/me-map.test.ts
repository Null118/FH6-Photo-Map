import { describe, expect, it } from "vitest";

import {
  buildOwnerMapStats,
  getOwnerStatusLabel,
  getOwnerMarkerVariant,
  getResubmissionReviewState,
} from "@/lib/me-map";

describe("me map helpers", () => {
  it("builds personal map stats from owned locations", () => {
    const stats = buildOwnerMapStats([
      { status: "approved", photos: [{ id: "p1" }, { id: "p2" }] },
      { status: "pending", photos: [{ id: "p3" }] },
      { status: "rejected", photos: [] },
    ]);

    expect(stats).toEqual({
      locationCount: 3,
      photoCount: 3,
      approvedCount: 1,
      pendingCount: 1,
      rejectedCount: 1,
    });
  });

  it("maps review states to owner marker color variants", () => {
    expect(getOwnerMarkerVariant("approved")).toBe("approved");
    expect(getOwnerMarkerVariant("pending")).toBe("pending");
    expect(getOwnerMarkerVariant("draft")).toBe("pending");
    expect(getOwnerMarkerVariant("rejected")).toBe("rejected");
    expect(getOwnerMarkerVariant("archived")).toBe("rejected");
  });

  it("uses user-facing owner status labels for the personal map", () => {
    expect(getOwnerStatusLabel("approved")).toBe("已通过");
    expect(getOwnerStatusLabel("pending")).toBe("待审核");
    expect(getOwnerStatusLabel("draft")).toBe("待审核");
    expect(getOwnerStatusLabel("rejected")).toBe("未通过");
    expect(getOwnerStatusLabel("archived")).toBe("未通过");
  });

  it("uses a single resubmission state after user edits", () => {
    expect(getResubmissionReviewState()).toEqual({
      status: "pending",
      isPublished: false,
    });
  });
});
