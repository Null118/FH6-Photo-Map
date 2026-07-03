import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthSession, LocationMapItem } from "@/types";

import { MapCanvas } from "./map-canvas";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
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

vi.mock("./map-session-bottom-bar", () => ({
  MapSessionBottomBar: () => <nav aria-label="登录用户地图操作" />,
}));

class ResizeObserverMock {
  observe() {}
  disconnect() {}
}

const locations: LocationMapItem[] = Array.from({ length: 3 }, (_, index) => ({
  id: `location-${index}`,
  title: `地点 ${index}`,
  x: 0.2 + index * 0.2,
  y: 0.3 + index * 0.1,
  isPublished: true,
  status: "approved",
  coverImagePath: `/uploads/photo-${index}.jpg`,
  photoCount: index + 1,
}));

const manyLocations: LocationMapItem[] = Array.from({ length: 18 }, (_, index) => ({
  id: `many-location-${index}`,
  title: `自由地点 ${index}`,
  x: (index % 6) * 0.15 + 0.08,
  y: Math.floor(index / 6) * 0.2 + 0.22,
  isPublished: true,
  status: "approved",
  coverImagePath: index === 17 ? null : `/uploads/many-photo-${index}.jpg`,
  photoCount: index + 1,
}));

const regionalLocations: LocationMapItem[] = Array.from({ length: 48 }, (_, index) => ({
  id: `regional-location-${index}`,
  title: `区域地点 ${index}`,
  x: (index % 8) / 8 + 0.04,
  y: Math.floor(index / 8) / 6 + 0.04,
  isPublished: true,
  status: "approved",
  coverImagePath: `/uploads/regional-photo-${index}.jpg`,
  photoCount: index + 1,
}));

const dragBoundaryLocations: LocationMapItem[] = [
  { id: "inside-a", title: "最终视野内 A", x: 0.46, y: 0.34 },
  { id: "inside-b", title: "最终视野内 B", x: 0.62, y: 0.5 },
  { id: "inside-c", title: "最终视野内 C", x: 0.82, y: 0.68 },
  { id: "outside-left", title: "最终视野外 左侧", x: 0.375, y: 0.5 },
  { id: "outside-top", title: "最终视野外 上方", x: 0.55, y: 0.26 },
  { id: "outside-bottom", title: "最终视野外 下方", x: 0.7, y: 0.74 },
].map((location, index) => ({
  ...location,
  isPublished: true,
  status: "approved",
  coverImagePath: `/uploads/drag-boundary-${index}.jpg`,
  photoCount: index + 1,
}));

const wheelBoundaryLocations: LocationMapItem[] = [
  { id: "zoom-inside-a", title: "缩放视野内 A", x: 0.14, y: 0.3 },
  { id: "zoom-inside-b", title: "缩放视野内 B", x: 0.5, y: 0.5 },
  { id: "zoom-inside-c", title: "缩放视野内 C", x: 0.86, y: 0.7 },
  { id: "zoom-outside-left", title: "缩放视野外 左侧", x: 0.1, y: 0.5 },
  { id: "zoom-outside-right", title: "缩放视野外 右侧", x: 0.9, y: 0.5 },
  { id: "zoom-outside-top", title: "缩放视野外 上方", x: 0.5, y: 0.27 },
  { id: "zoom-outside-bottom", title: "缩放视野外 下方", x: 0.5, y: 0.72 },
].map((location, index) => ({
  ...location,
  isPublished: true,
  status: "approved",
  coverImagePath: `/uploads/wheel-boundary-${index}.jpg`,
  photoCount: index + 1,
}));

const session: AuthSession = {
  userId: "user-1",
  role: "user",
  username: "driver",
  displayName: "Driver",
  expiresAt: Date.now() + 60_000,
};

describe("MapCanvas", () => {
  beforeEach(() => {
    pushMock.mockClear();
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("shows a static showcase rail on the homepage by default", () => {
    render(<MapCanvas locations={locations} session={null} />);

    expect(screen.getByRole("region", { name: "精选摄影地点" })).not.toBeNull();
    expect(screen.getByRole("button", { name: /在地图中查看 地点 0/ })).not.toBeNull();
    expect(screen.getByRole("button", { name: "添加标点" })).not.toBeNull();
  });

  it("does not treat the homepage showcase as a zoomable map until add mode starts", () => {
    render(<MapCanvas locations={locations} session={session} />);

    const viewport = screen.getByTestId("map-viewport");
    const staticWheel = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaY: -120,
    });
    const staticPreventDefault = vi.spyOn(staticWheel, "preventDefault");

    viewport.dispatchEvent(staticWheel);

    expect(staticPreventDefault).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "添加标点" }));

    const addingWheel = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaY: -120,
    });
    const addingPreventDefault = vi.spyOn(addingWheel, "preventDefault");

    viewport.dispatchEvent(addingWheel);

    expect(addingPreventDefault).toHaveBeenCalled();
    expect(screen.queryByRole("region", { name: "精选摄影地点" })).toBeNull();
  });

  it("opens the interactive browse map from a showcase preview without navigating away", () => {
    render(<MapCanvas locations={locations} session={null} />);

    fireEvent.click(screen.getByRole("button", { name: /在地图中查看 地点 0/ }));

    expect(pushMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("region", { name: "精选摄影地点" })).toBeNull();

    const viewport = screen.getByTestId("map-viewport");
    const browseWheel = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaY: -120,
    });
    const browsePreventDefault = vi.spyOn(browseWheel, "preventDefault");

    viewport.dispatchEvent(browseWheel);

    expect(browsePreventDefault).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "地点 0" }).className).toContain("is-highlighted");
  });

  it("opens free exploration from the HUD while keeping add mode available", () => {
    render(<MapCanvas locations={locations} session={session} />);

    fireEvent.click(screen.getByRole("button", { name: "自由探索" }));

    expect(screen.queryByRole("region", { name: "精选摄影地点" })).toBeNull();

    const viewport = screen.getByTestId("map-viewport");
    const browseWheel = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaY: -120,
    });
    const browsePreventDefault = vi.spyOn(browseWheel, "preventDefault");

    viewport.dispatchEvent(browseWheel);

    expect(browsePreventDefault).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "添加标点" }));

    expect(screen.getByRole("button", { name: "退出打点模式" })).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "退出打点模式" }));

    expect(screen.queryByRole("region", { name: "精选摄影地点" })).toBeNull();
    expect(screen.getByRole("button", { name: "添加标点" })).not.toBeNull();
  });

  it("keeps the HUD in the dark visual treatment while adding a marker", () => {
    const { container } = render(<MapCanvas locations={locations} session={session} />);

    fireEvent.click(screen.getByRole("button", { name: "添加标点" }));

    expect(container.querySelector(".map-hud")?.className).not.toContain("is-adding");
  });

  it("shows about fifteen preview markers and hides locations without preview images", () => {
    render(<MapCanvas locations={manyLocations} session={session} />);

    fireEvent.click(screen.getByRole("button", { name: "自由探索" }));

    expect(screen.getAllByText(/自由地点/)).toHaveLength(15);
    expect(screen.queryByRole("button", { name: "自由地点 17" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "添加标点" }));

    expect(screen.getAllByText(/自由地点/)).toHaveLength(15);
    expect(screen.queryByRole("button", { name: "自由地点 17" })).toBeNull();
  });

  it("keeps preview markers stable while dragging and refreshes them after the drag ends", () => {
    vi.useFakeTimers();
    render(<MapCanvas locations={regionalLocations} session={session} />);

    fireEvent.click(screen.getByRole("button", { name: "自由探索" }));

    const viewport = screen.getByTestId("map-viewport");
    vi.spyOn(viewport, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 1280,
      height: 900,
      right: 1280,
      bottom: 900,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    const initialNames = screen.getAllByText(/区域地点/).map((node) => node.textContent);

    fireEvent.wheel(viewport, {
      clientX: 640,
      clientY: 450,
      deltaY: -320,
    });

    act(() => {
      vi.advanceTimersByTime(180);
    });

    const zoomedNames = screen.getAllByText(/区域地点/).map((node) => node.textContent);
    expect(zoomedNames).not.toEqual(initialNames);

    fireEvent.pointerDown(viewport, {
      clientX: 640,
      clientY: 450,
      pointerId: 1,
    });
    fireEvent.pointerMove(viewport, {
      clientX: 160,
      clientY: 450,
      pointerId: 1,
    });

    const draggingNames = screen.getAllByText(/区域地点/).map((node) => node.textContent);
    expect(draggingNames).toEqual(zoomedNames);

    fireEvent.pointerUp(viewport, {
      clientX: 160,
      clientY: 450,
      pointerId: 1,
    });

    const draggedNames = screen.getAllByText(/区域地点/).map((node) => node.textContent);
    expect(draggedNames).not.toEqual(zoomedNames);
  });

  it("keeps preview markers stable while zooming and refreshes them after the wheel settles", () => {
    vi.useFakeTimers();
    render(<MapCanvas locations={regionalLocations} session={session} />);

    fireEvent.click(screen.getByRole("button", { name: "自由探索" }));

    const viewport = screen.getByTestId("map-viewport");
    vi.spyOn(viewport, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 1280,
      height: 900,
      right: 1280,
      bottom: 900,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    const initialNames = screen.getAllByText(/区域地点/).map((node) => node.textContent);

    fireEvent.wheel(viewport, {
      clientX: 640,
      clientY: 450,
      deltaY: -320,
    });

    const zoomingNames = screen.getAllByText(/区域地点/).map((node) => node.textContent);
    expect(zoomingNames).toEqual(initialNames);

    act(() => {
      vi.advanceTimersByTime(180);
    });

    const settledNames = screen.getAllByText(/区域地点/).map((node) => node.textContent);
    expect(settledNames).not.toEqual(initialNames);
  });

  it("keeps settled zoom previews inside the final visible map range", () => {
    vi.useFakeTimers();
    render(<MapCanvas locations={wheelBoundaryLocations} session={session} />);

    fireEvent.click(screen.getByRole("button", { name: "自由探索" }));

    const viewport = screen.getByTestId("map-viewport");
    vi.spyOn(viewport, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 1280,
      height: 900,
      right: 1280,
      bottom: 900,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    fireEvent.wheel(viewport, {
      clientX: 640,
      clientY: 450,
      deltaY: -320,
    });

    act(() => {
      vi.advanceTimersByTime(180);
    });

    expect(screen.getByRole("button", { name: "缩放视野内 A" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "缩放视野内 B" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "缩放视野内 C" })).not.toBeNull();
    expect(screen.queryByRole("button", { name: "缩放视野外 左侧" })).toBeNull();
    expect(screen.queryByRole("button", { name: "缩放视野外 右侧" })).toBeNull();
    expect(screen.queryByRole("button", { name: "缩放视野外 上方" })).toBeNull();
    expect(screen.queryByRole("button", { name: "缩放视野外 下方" })).toBeNull();
  });

  it("keeps refreshed drag previews inside the final visible map range", () => {
    render(<MapCanvas locations={dragBoundaryLocations} session={session} />);

    fireEvent.click(screen.getByRole("button", { name: "自由探索" }));

    const viewport = screen.getByTestId("map-viewport");
    vi.spyOn(viewport, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 1280,
      height: 900,
      right: 1280,
      bottom: 900,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    fireEvent.wheel(viewport, {
      clientX: 640,
      clientY: 450,
      deltaY: -320,
    });
    fireEvent.pointerDown(viewport, {
      clientX: 640,
      clientY: 450,
      pointerId: 1,
    });
    fireEvent.pointerMove(viewport, {
      clientX: 160,
      clientY: 450,
      pointerId: 1,
    });
    fireEvent.pointerUp(viewport, {
      clientX: 160,
      clientY: 450,
      pointerId: 1,
    });

    expect(screen.getByRole("button", { name: "最终视野内 A" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "最终视野内 B" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "最终视野内 C" })).not.toBeNull();
    expect(screen.queryByRole("button", { name: "最终视野外 左侧" })).toBeNull();
    expect(screen.queryByRole("button", { name: "最终视野外 上方" })).toBeNull();
    expect(screen.queryByRole("button", { name: "最终视野外 下方" })).toBeNull();
  });

  it("commits the final preview range when a drag is cancelled by the browser", () => {
    render(<MapCanvas locations={regionalLocations} session={session} />);

    fireEvent.click(screen.getByRole("button", { name: "自由探索" }));

    const viewport = screen.getByTestId("map-viewport");
    vi.spyOn(viewport, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 1280,
      height: 900,
      right: 1280,
      bottom: 900,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    fireEvent.wheel(viewport, {
      clientX: 640,
      clientY: 450,
      deltaY: -320,
    });

    const zoomedNames = screen.getAllByText(/区域地点/).map((node) => node.textContent);

    fireEvent.pointerDown(viewport, {
      clientX: 640,
      clientY: 450,
      pointerId: 1,
    });
    fireEvent.pointerMove(viewport, {
      clientX: 160,
      clientY: 450,
      pointerId: 1,
    });
    fireEvent.pointerCancel(viewport, {
      clientX: 160,
      clientY: 450,
      pointerId: 1,
    });

    const cancelledNames = screen.getAllByText(/区域地点/).map((node) => node.textContent);
    expect(cancelledNames).not.toEqual(zoomedNames);
  });

  it("does not create a new location from a quick click while browsing existing previews", () => {
    render(<MapCanvas locations={locations} session={null} />);

    fireEvent.click(screen.getByRole("button", { name: /在地图中查看 地点 0/ }));

    const viewport = screen.getByTestId("map-viewport");
    fireEvent.pointerDown(viewport, {
      clientX: 320,
      clientY: 260,
      pointerId: 1,
    });
    fireEvent.pointerUp(viewport, {
      clientX: 320,
      clientY: 260,
      pointerId: 1,
    });

    expect(pushMock).not.toHaveBeenCalledWith(expect.stringContaining("/locations/new"));
  });
});
