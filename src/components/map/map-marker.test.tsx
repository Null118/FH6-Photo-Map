import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MapMarker } from "./map-marker";

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

describe("MapMarker", () => {
  it("keeps photo counts out of the preview card and exposes them as a delayed pin tooltip", () => {
    render(
      <MapMarker
        left="42%"
        top="56%"
        label="FH6 Demo Spot 022"
        coverImagePath="/uploads/fh6-demo-022.jpg"
        photoCount={1}
        showPreview
      />,
    );

    const marker = screen.getByRole("button", { name: "FH6 Demo Spot 022" });
    const preview = marker.querySelector(".map-marker__preview");

    expect(preview).not.toBeNull();
    expect(within(preview as HTMLElement).getByText("FH6 Demo Spot 022")).not.toBeNull();
    expect(within(preview as HTMLElement).queryByText("1 张照片")).toBeNull();
    expect(screen.getByText("1 张图片").className).toContain("map-marker__photo-tooltip");
    expect(screen.getByText("1 张图片").className).toContain("is-pin-right");
  });
});
