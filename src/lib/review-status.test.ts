import { describe, expect, it } from "vitest";

import {
  getAdminReviewFilterLabel,
  getAdminReviewFilterWhere,
  isPendingReview,
  normalizeAdminReviewFilter,
  reviewStatusText,
} from "@/lib/review-status";

describe("review status helpers", () => {
  it("only treats pending content as reviewable", () => {
    expect(isPendingReview("pending")).toBe(true);
    expect(isPendingReview("approved")).toBe(false);
    expect(isPendingReview("rejected")).toBe(false);
  });

  it("provides Chinese labels for admin pages", () => {
    expect(reviewStatusText.approved).toBe("已通过");
    expect(reviewStatusText.pending).toBe("待审核");
  });

  it("normalizes admin review filters from url params", () => {
    expect(normalizeAdminReviewFilter(undefined)).toBe("all");
    expect(normalizeAdminReviewFilter("pending")).toBe("pending");
    expect(normalizeAdminReviewFilter("reviewed")).toBe("reviewed");
    expect(normalizeAdminReviewFilter("bad-value")).toBe("all");
  });

  it("builds prisma where clauses for admin review filters", () => {
    expect(getAdminReviewFilterWhere("all")).toEqual({});
    expect(getAdminReviewFilterWhere("pending")).toEqual({ status: "pending" });
    expect(getAdminReviewFilterWhere("reviewed")).toEqual({
      status: {
        in: ["approved", "rejected", "archived"],
      },
    });
  });

  it("labels admin review filters for navigation", () => {
    expect(getAdminReviewFilterLabel("all")).toBe("全部标点");
    expect(getAdminReviewFilterLabel("pending")).toBe("待审核");
    expect(getAdminReviewFilterLabel("reviewed")).toBe("已审核");
  });
});
