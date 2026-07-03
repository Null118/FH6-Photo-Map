import type { ReviewStatus } from "@prisma/client";

export type AdminReviewFilter = "all" | "pending" | "reviewed";

export const reviewStatusText = {
  draft: "草稿",
  pending: "待审核",
  approved: "已通过",
  rejected: "已拒绝",
  archived: "已归档",
} satisfies Record<ReviewStatus, string>;

export function isPendingReview(status: ReviewStatus) {
  return status === "pending";
}

export function normalizeAdminReviewFilter(value: string | string[] | undefined): AdminReviewFilter {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (rawValue === "pending" || rawValue === "reviewed") {
    return rawValue;
  }

  return "all";
}

export function getAdminReviewFilterWhere(filter: AdminReviewFilter) {
  if (filter === "pending") {
    return { status: "pending" as const };
  }

  if (filter === "reviewed") {
    return {
      status: {
        in: ["approved", "rejected", "archived"] as ReviewStatus[],
      },
    };
  }

  return {};
}

export function getAdminReviewFilterLabel(filter: AdminReviewFilter) {
  if (filter === "pending") {
    return "待审核";
  }

  if (filter === "reviewed") {
    return "已审核";
  }

  return "全部标点";
}
