import { describe, expect, it } from "vitest";
import {
  CLICK_DURATION_MS,
  DRAG_DISTANCE_PX,
  MAX_SCALE,
  MAP_ASPECT_RATIO,
  MAP_HEIGHT,
  MAP_WIDTH,
  MIN_SCALE,
  clampOffset,
  clampNumber,
  clampScale,
  getCenteredOffset,
  getCoveringViewport,
  getFocusedOffset,
  getPreviewSelectionSeed,
  hasDragged,
  isQuickClick,
  normalizeRelativePoint,
  getVisibleMapBounds,
  getPreviewSelectionForScale,
  getShowcasePreviewSelection,
  selectPreviewLocations,
} from "@/lib/map";

describe("map helpers", () => {
  it("treats distances above the drag threshold as dragging", () => {
    expect(
      hasDragged(
        { x: 10, y: 10 },
        { x: 10 + DRAG_DISTANCE_PX + 1, y: 10 },
      ),
    ).toBe(true);
  });

  it("does not treat short movement as dragging", () => {
    expect(
      hasDragged(
        { x: 10, y: 10 },
        { x: 10 + DRAG_DISTANCE_PX - 1, y: 10 },
      ),
    ).toBe(false);
  });

  it("accepts quick clicks and rejects long presses", () => {
    expect(isQuickClick(CLICK_DURATION_MS)).toBe(true);
    expect(isQuickClick(CLICK_DURATION_MS + 1)).toBe(false);
  });

  it("clamps numeric values into the provided range", () => {
    expect(clampNumber(-1, 0, 1)).toBe(0);
    expect(clampNumber(0.4, 0, 1)).toBe(0.4);
    expect(clampNumber(4, 0, 1)).toBe(1);
  });

  it("clamps map scale to the supported zoom range", () => {
    expect(MIN_SCALE).toBeLessThan(1);
    expect(clampScale(MIN_SCALE - 1)).toBe(MIN_SCALE);
    expect(clampScale(0.5)).toBe(0.5);
    expect(clampScale(2)).toBe(2);
    expect(clampScale(MAX_SCALE + 1)).toBe(MAX_SCALE);
  });

  it("calculates a covering viewport that preserves the full map ratio", () => {
    expect(MAP_WIDTH / MAP_HEIGHT).toBe(MAP_ASPECT_RATIO);

    expect(
      getCoveringViewport({
        outerWidth: 1440,
        outerHeight: 900,
        sidebarWidth: 320,
        topInset: 32,
        bottomInset: 32,
      }),
    ).toMatchObject({
      width: expect.closeTo(1120, 5),
      height: expect.closeTo(1400, 5),
    });

    expect(
      getCoveringViewport({
        outerWidth: 768,
        outerHeight: 960,
        sidebarWidth: 0,
        topInset: 24,
        bottomInset: 120,
      }),
    ).toMatchObject({
      width: expect.closeTo(768, 5),
      height: expect.closeTo(960, 5),
    });

    expect(
      getCoveringViewport({
        outerWidth: 1600,
        outerHeight: 900,
        sidebarWidth: 0,
        topInset: 0,
        bottomInset: 0,
      }),
    ).toMatchObject({
      width: expect.closeTo(1600, 5),
      height: expect.closeTo(2000, 5),
    });
  });

  it("returns the centered offset for an initial fitted map", () => {
    expect(
      getCenteredOffset({
        frameWidth: 1600,
        frameHeight: 900,
        contentWidth: 720,
        contentHeight: 900,
        scale: 1,
      }),
    ).toEqual({ x: 440, y: 0 });
  });

  it("returns a clamped offset that centers a focused map point", () => {
    expect(
      getFocusedOffset({
        frameWidth: 1600,
        frameHeight: 900,
        contentWidth: 1600,
        contentHeight: 2000,
        scale: 1.5,
        x: 0.5,
        y: 0.25,
      }),
    ).toEqual({
      x: -400,
      y: -300,
    });

    expect(
      getFocusedOffset({
        frameWidth: 1600,
        frameHeight: 900,
        contentWidth: 1600,
        contentHeight: 2000,
        scale: 1.5,
        x: 0.98,
        y: 0.98,
      }),
    ).toEqual({
      x: -1552,
      y: -2490,
    });
  });

  it("clamps dragged offsets and recenters when the user zooms out below the frame size", () => {
    expect(
      clampOffset({
        frameWidth: 540,
        frameHeight: 675,
        contentWidth: 540,
        contentHeight: 675,
        scale: 1,
        offsetX: 120,
        offsetY: -80,
      }),
    ).toEqual({ x: 120, y: -80 });

    expect(
      clampOffset({
        frameWidth: 540,
        frameHeight: 675,
        contentWidth: 540,
        contentHeight: 675,
        scale: 1.5,
        offsetX: 120,
        offsetY: -400,
      }),
    ).toEqual({ x: 120, y: -400 });

    expect(
      clampOffset({
        frameWidth: 540,
        frameHeight: 675,
        contentWidth: 540,
        contentHeight: 675,
        scale: 1.5,
        offsetX: -400,
        offsetY: 80,
      }),
    ).toEqual({ x: -400, y: 80 });

    expect(
      clampOffset({
        frameWidth: 1600,
        frameHeight: 900,
        contentWidth: 720,
        contentHeight: 900,
        scale: 0.7,
        offsetX: -50,
        offsetY: -30,
      }),
    ).toEqual({ x: -50, y: -30 });
  });

  it("allows freer horizontal dragging even when the map is smaller or aligned to an edge", () => {
    expect(
      clampOffset({
        frameWidth: 1600,
        frameHeight: 900,
        contentWidth: 720,
        contentHeight: 900,
        scale: 0.7,
        offsetX: 320,
        offsetY: -30,
      }),
    ).toEqual({ x: 320, y: -30 });

    expect(
      clampOffset({
        frameWidth: 1600,
        frameHeight: 900,
        contentWidth: 1600,
        contentHeight: 2000,
        scale: 1,
        offsetX: 180,
        offsetY: -120,
      }),
    ).toEqual({ x: 180, y: -120 });

    expect(
      clampOffset({
        frameWidth: 1600,
        frameHeight: 900,
        contentWidth: 1600,
        contentHeight: 2000,
        scale: 1,
        offsetX: -260,
        offsetY: -120,
      }),
    ).toEqual({ x: -260, y: -120 });
  });

  it("keeps at least half of the frame covered when dragging an oversized map", () => {
    expect(
      clampOffset({
        frameWidth: 1600,
        frameHeight: 900,
        contentWidth: 1600,
        contentHeight: 2000,
        scale: 1,
        offsetX: 1200,
        offsetY: 1300,
      }),
    ).toEqual({ x: 800, y: 450 });

    expect(
      clampOffset({
        frameWidth: 1600,
        frameHeight: 900,
        contentWidth: 1600,
        contentHeight: 2000,
        scale: 1,
        offsetX: -1200,
        offsetY: -1400,
      }),
    ).toEqual({ x: -800, y: -1400 });

    expect(
      clampOffset({
        frameWidth: 1600,
        frameHeight: 900,
        contentWidth: 720,
        contentHeight: 900,
        scale: 0.7,
        offsetX: 1800,
        offsetY: -600,
      }),
    ).toEqual({ x: 1348, y: -315 });
  });

  it("allows taller maps to move vertically until only half the frame still shows the map", () => {
    expect(
      clampOffset({
        frameWidth: 1600,
        frameHeight: 900,
        contentWidth: 1600,
        contentHeight: 2000,
        scale: 1,
        offsetX: 0,
        offsetY: 150,
      }),
    ).toEqual({ x: 0, y: 150 });

    expect(
      clampOffset({
        frameWidth: 1600,
        frameHeight: 900,
        contentWidth: 1600,
        contentHeight: 2000,
        scale: 1,
        offsetX: 0,
        offsetY: 900,
      }),
    ).toEqual({ x: 0, y: 450 });

    expect(
      clampOffset({
        frameWidth: 1600,
        frameHeight: 900,
        contentWidth: 1600,
        contentHeight: 2000,
        scale: 1,
        offsetX: 0,
        offsetY: -1700,
      }),
    ).toEqual({ x: 0, y: -1550 });
  });

  it("normalizes relative map coordinates and keeps them inside the map", () => {
    expect(
      normalizeRelativePoint({
        clientX: 300,
        clientY: 170,
        rectLeft: 100,
        rectTop: 50,
        rectWidth: 400,
        rectHeight: 200,
        contentWidth: 400,
        contentHeight: 200,
        offsetX: 20,
        offsetY: -10,
        scale: 2,
      }),
    ).toEqual({
      x: 0.225,
      y: 0.325,
    });

    expect(
      normalizeRelativePoint({
        clientX: 0,
        clientY: 0,
        rectLeft: 100,
        rectTop: 100,
        rectWidth: 400,
        rectHeight: 200,
        contentWidth: 400,
        contentHeight: 200,
        offsetX: 0,
        offsetY: 0,
        scale: 1,
      }),
    ).toEqual({
      x: 0,
      y: 0,
    });
  });

  it("normalizes clicks against the full map surface when it overflows the viewport", () => {
    expect(
      normalizeRelativePoint({
        clientX: 1200,
        clientY: 520,
        rectLeft: 0,
        rectTop: 0,
        rectWidth: 1600,
        rectHeight: 900,
        contentWidth: 1600,
        contentHeight: 2000,
        offsetX: 0,
        offsetY: -550,
        scale: 1,
      }),
    ).toEqual({
      x: 0.75,
      y: 0.535,
    });
  });

  it("calculates the normalized map area visible in the current viewport", () => {
    expect(
      getVisibleMapBounds({
        frameWidth: 1600,
        frameHeight: 900,
        contentWidth: 1600,
        contentHeight: 2000,
        scale: 1,
        offsetX: 0,
        offsetY: -550,
      }),
    ).toEqual({
      minX: 0,
      maxX: 1,
      minY: 0.275,
      maxY: 0.725,
    });

    expect(
      getVisibleMapBounds({
        frameWidth: 1600,
        frameHeight: 900,
        contentWidth: 1600,
        contentHeight: 2000,
        scale: 2,
        offsetX: -800,
        offsetY: -1200,
        padding: 0.02,
      }),
    ).toEqual({
      minX: 0.23,
      maxX: 0.77,
      minY: 0.28,
      maxY: 0.545,
    });
  });

  it("selects at most ten stable preview locations with cover images", () => {
    const locations = Array.from({ length: 14 }, (_, index) => ({
      id: `spot-${index}`,
      title: `Spot ${index}`,
      x: (index % 7) / 7 + 0.03,
      y: Math.floor(index / 7) * 0.35 + 0.12,
      coverImagePath: index === 2 ? null : `/uploads/${index}.jpg`,
    }));

    const selected = selectPreviewLocations(locations, {
      maxCount: 10,
      minDistance: 0.01,
    });
    const reversedSelected = selectPreviewLocations([...locations].reverse(), {
      maxCount: 10,
      minDistance: 0.01,
    });

    expect(selected).toHaveLength(10);
    expect(selected.every((location) => location.coverImagePath)).toBe(true);
    expect(selected.map((location) => location.id)).toEqual(
      reversedSelected.map((location) => location.id),
    );
  });

  it("keeps preview cards separated on the initial map", () => {
    const locations = [
      { id: "dense-a", x: 0.1, y: 0.1, coverImagePath: "/uploads/a.jpg" },
      { id: "dense-b", x: 0.11, y: 0.1, coverImagePath: "/uploads/b.jpg" },
      { id: "far-c", x: 0.7, y: 0.75, coverImagePath: "/uploads/c.jpg" },
      { id: "far-d", x: 0.35, y: 0.65, coverImagePath: "/uploads/d.jpg" },
    ];

    const selected = selectPreviewLocations(locations, {
      maxCount: 4,
      minDistance: 0.12,
    });

    expect(selected).toHaveLength(3);
    expect(selected.some((location) => location.id === "dense-a")).not.toBe(
      selected.some((location) => location.id === "dense-b"),
    );
  });

  it("shows a rich default preview set and reduces density as preview cards get scaled up", () => {
    expect(getPreviewSelectionForScale(1)).toEqual({
      maxCount: 15,
      minDistance: 0.115,
    });
    expect(getPreviewSelectionForScale(1.8).maxCount).toBeLessThan(
      getPreviewSelectionForScale(1).maxCount,
    );
    expect(getPreviewSelectionForScale(1.8).minDistance).toBeLessThan(
      getPreviewSelectionForScale(1).minDistance,
    );
    expect(getPreviewSelectionForScale(3.5)).toEqual({
      maxCount: 5,
      minDistance: 0.075,
    });
  });

  it("uses viewport and zoom buckets to pick a fresh stable preview set", () => {
    const locations = Array.from({ length: 48 }, (_, index) => ({
      id: `viewport-${index}`,
      x: (index % 8) / 8 + 0.04,
      y: Math.floor(index / 8) / 6 + 0.04,
      coverImagePath: `/uploads/viewport-${index}.jpg`,
    }));
    const leftBounds = { minX: 0, maxX: 0.52, minY: 0.2, maxY: 0.8 };
    const rightBounds = { minX: 0.48, maxX: 1, minY: 0.2, maxY: 0.8 };
    const leftSeed = getPreviewSelectionSeed({ bounds: leftBounds, scale: 1 });
    const zoomedSeed = getPreviewSelectionSeed({ bounds: leftBounds, scale: 1.32 });
    const rightSeed = getPreviewSelectionSeed({ bounds: rightBounds, scale: 1.32 });

    const leftSelected = selectPreviewLocations(locations, {
      ...getPreviewSelectionForScale(1),
      bounds: leftBounds,
      seed: leftSeed,
    });
    const zoomSelected = selectPreviewLocations(locations, {
      ...getPreviewSelectionForScale(1.32),
      bounds: leftBounds,
      seed: zoomedSeed,
    });
    const rightSelected = selectPreviewLocations(locations, {
      ...getPreviewSelectionForScale(1.32),
      bounds: rightBounds,
      seed: rightSeed,
    });

    expect(leftSelected).toHaveLength(15);
    expect(leftSelected.every((location) => location.x <= leftBounds.maxX)).toBe(true);
    expect(zoomSelected.map((location) => location.id)).not.toEqual(
      leftSelected.map((location) => location.id),
    );
    expect(rightSelected.every((location) => location.x >= rightBounds.minX)).toBe(true);
    expect(rightSelected.map((location) => location.id)).not.toEqual(
      zoomSelected.map((location) => location.id),
    );
  });

  it("uses a compact stable selection for the homepage showcase rail", () => {
    const locations = Array.from({ length: 12 }, (_, index) => ({
      id: `showcase-${index}`,
      x: index / 12,
      y: 0.5,
      coverImagePath: index === 4 ? null : `/uploads/showcase-${index}.jpg`,
    }));

    const selected = selectPreviewLocations(locations, getShowcasePreviewSelection());
    const reversedSelected = selectPreviewLocations([...locations].reverse(), getShowcasePreviewSelection());

    expect(getShowcasePreviewSelection()).toEqual({
      maxCount: 8,
      minDistance: 0,
    });
    expect(selected).toHaveLength(8);
    expect(selected.every((location) => location.coverImagePath)).toBe(true);
    expect(selected.map((location) => location.id)).toEqual(
      reversedSelected.map((location) => location.id),
    );
  });
});
