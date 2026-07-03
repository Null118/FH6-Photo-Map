import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OwnerMapCanvas } from "./owner-map-canvas";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock("next/image", () => ({
  default: ({
    alt,
    className,
    src,
  }: {
    alt?: string;
    className?: string;
    src: string;
  }) => <span aria-label={alt} className={className} data-src={src} role="img" />,
}));

class ResizeObserverMock {
  observe() {}
  disconnect() {}
}

const locations = [
  {
    id: "location-1",
    title: "FH6 Demo Spot 001",
    x: 0.42,
    y: 0.56,
    isPublished: true,
    status: "approved" as const,
    coverImagePath: "/uploads/fh6-demo-001.jpg",
    photoCount: 1,
    markerVariant: "approved" as const,
    statusLabel: "已通过",
  },
  {
    id: "location-2",
    title: "FH6 Demo Spot 041",
    x: 0.64,
    y: 0.42,
    isPublished: false,
    status: "pending" as const,
    coverImagePath: "/uploads/fh6-demo-041.jpg",
    photoCount: 2,
    markerVariant: "pending" as const,
    statusLabel: "待审核",
  },
];

const stats = {
  locationCount: 2,
  photoCount: 3,
  approvedCount: 1,
  pendingCount: 1,
  rejectedCount: 0,
};

describe("OwnerMapCanvas", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders the personal map stage as visible and interactive by default", () => {
    const { container } = render(<OwnerMapCanvas locations={locations} stats={stats} />);

    const shell = container.querySelector(".owner-map-shell");
    const mapStage = container.querySelector(".owner-map-stage");

    expect(shell?.className).toContain("is-interactive");
    expect(container.querySelector(".map-stage__ambient-image")).not.toBeNull();
    expect(mapStage?.className).toContain("is-browsing");
    expect(screen.getByRole("button", { name: "FH6 Demo Spot 001" })).not.toBeNull();
  });

  it("shows an owner management list with per-location edit links", () => {
    render(<OwnerMapCanvas locations={locations} stats={stats} />);

    const list = screen.getByRole("list", { name: "我的地点列表" });
    const rows = within(list).getAllByRole("listitem");

    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getAllByText("FH6 Demo Spot 001")).toHaveLength(2);
    expect(within(rows[0]).getByText("X 42.00% / Y 56.00%")).not.toBeNull();
    expect(within(rows[0]).getByText("已通过")).not.toBeNull();
    expect(within(rows[0]).getByRole("link", { name: "编辑 FH6 Demo Spot 001" }).getAttribute("href")).toBe(
      "/me/locations/location-1",
    );

    expect(within(rows[1]).getAllByText("FH6 Demo Spot 041")).toHaveLength(2);
    expect(within(rows[1]).getByText("待审核")).not.toBeNull();
  });
});
