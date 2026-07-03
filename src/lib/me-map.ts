import type { ReviewStatus } from "@prisma/client";

export type OwnerMarkerVariant = "approved" | "pending" | "rejected";

export type OwnerMapStatsInput = {
  status: ReviewStatus;
  photos: unknown[];
};

export function getOwnerMarkerVariant(status: ReviewStatus): OwnerMarkerVariant {
  if (status === "approved") {
    return "approved";
  }

  if (status === "rejected" || status === "archived") {
    return "rejected";
  }

  return "pending";
}

export function getOwnerStatusLabel(status: ReviewStatus) {
  const variant = getOwnerMarkerVariant(status);

  if (variant === "approved") {
    return "已通过";
  }

  if (variant === "rejected") {
    return "未通过";
  }

  return "待审核";
}

export function buildOwnerMapStats(locations: OwnerMapStatsInput[]) {
  return locations.reduce(
    (stats, location) => {
      stats.locationCount += 1;
      stats.photoCount += location.photos.length;

      const variant = getOwnerMarkerVariant(location.status);
      if (variant === "approved") {
        stats.approvedCount += 1;
      } else if (variant === "pending") {
        stats.pendingCount += 1;
      } else {
        stats.rejectedCount += 1;
      }

      return stats;
    },
    {
      locationCount: 0,
      photoCount: 0,
      approvedCount: 0,
      pendingCount: 0,
      rejectedCount: 0,
    },
  );
}

export function getResubmissionReviewState() {
  return {
    status: "pending" as const,
    isPublished: false,
  };
}
