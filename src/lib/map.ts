export const DRAG_DISTANCE_PX = 6;
export const CLICK_DURATION_MS = 220;
export const MIN_SCALE = 0.35;
export const MAX_SCALE = 3.5;
export const MAP_WIDTH = 2160;
export const MAP_HEIGHT = 2700;
export const MAP_ASPECT_RATIO = MAP_WIDTH / MAP_HEIGHT;

export type Point = {
  x: number;
  y: number;
};

export type ViewportInput = {
  outerWidth: number;
  outerHeight: number;
  sidebarWidth: number;
  topInset: number;
  bottomInset: number;
};

export type OffsetClampInput = {
  frameWidth: number;
  frameHeight: number;
  contentWidth: number;
  contentHeight: number;
  scale: number;
  offsetX: number;
  offsetY: number;
};

export type CenteredOffsetInput = {
  frameWidth: number;
  frameHeight: number;
  contentWidth: number;
  contentHeight: number;
  scale: number;
};

export type FocusedOffsetInput = CenteredOffsetInput & Point;

export type RelativePointInput = {
  clientX: number;
  clientY: number;
  rectLeft: number;
  rectTop: number;
  rectWidth: number;
  rectHeight: number;
  contentWidth: number;
  contentHeight: number;
  offsetX: number;
  offsetY: number;
  scale: number;
};

export type PreviewLocationCandidate = {
  id: string;
  x: number;
  y: number;
  coverImagePath?: string | null;
};

export type VisibleMapBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

export type PreviewSelectionOptions = {
  maxCount?: number;
  minDistance?: number;
  bounds?: VisibleMapBounds;
  seed?: string;
};

export type PreviewSelectionDensity = Required<
  Pick<PreviewSelectionOptions, "maxCount" | "minDistance">
>;

export type VisibleMapBoundsInput = OffsetClampInput & {
  padding?: number;
};

export type PreviewSelectionSeedInput = {
  bounds: VisibleMapBounds;
  scale: number;
};

export function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function hasDragged(start: Point, end: Point) {
  return Math.hypot(end.x - start.x, end.y - start.y) > DRAG_DISTANCE_PX;
}

export function isQuickClick(durationMs: number) {
  return durationMs <= CLICK_DURATION_MS;
}

export function clampScale(scale: number) {
  return clampNumber(scale, MIN_SCALE, MAX_SCALE);
}

export function getCoveringViewport(input: ViewportInput) {
  const availableWidth = Math.max(input.outerWidth - input.sidebarWidth, 280);
  const availableHeight = Math.max(input.outerHeight - input.topInset - input.bottomInset, 280);

  const widthFromHeight = availableHeight * MAP_ASPECT_RATIO;
  const heightFromWidth = availableWidth / MAP_ASPECT_RATIO;
  const width = Math.max(availableWidth, widthFromHeight);
  const height = Math.max(availableHeight, heightFromWidth);

  return {
    width,
    height,
  };
}

export function getCenteredOffset(input: CenteredOffsetInput) {
  const scaledWidth = input.contentWidth * input.scale;
  const scaledHeight = input.contentHeight * input.scale;

  return {
    x: (input.frameWidth - scaledWidth) / 2,
    y: (input.frameHeight - scaledHeight) / 2,
  };
}

export function getFocusedOffset(input: FocusedOffsetInput) {
  return clampOffset({
    frameWidth: input.frameWidth,
    frameHeight: input.frameHeight,
    contentWidth: input.contentWidth,
    contentHeight: input.contentHeight,
    scale: input.scale,
    offsetX: input.frameWidth / 2 - input.contentWidth * input.scale * input.x,
    offsetY: input.frameHeight / 2 - input.contentHeight * input.scale * input.y,
  });
}

export function clampOffset(input: OffsetClampInput) {
  const scaledWidth = input.contentWidth * input.scale;
  const scaledHeight = input.contentHeight * input.scale;
  const minOverlapWidth = Math.min(input.frameWidth, scaledWidth) / 2;
  const minOverlapHeight = Math.min(input.frameHeight, scaledHeight) / 2;
  const minX = minOverlapWidth - scaledWidth;
  const maxX = input.frameWidth - minOverlapWidth;
  const minY = minOverlapHeight - scaledHeight;
  const maxY = input.frameHeight - minOverlapHeight;

  return {
    x: clampNumber(input.offsetX, minX, maxX),
    y: clampNumber(input.offsetY, minY, maxY),
  };
}

export function normalizeRelativePoint(input: RelativePointInput) {
  const rawX =
    (input.clientX - input.rectLeft - input.offsetX) /
    (input.contentWidth * input.scale);
  const rawY =
    (input.clientY - input.rectTop - input.offsetY) /
    (input.contentHeight * input.scale);

  return {
    x: clampNumber(rawX, 0, 1),
    y: clampNumber(rawY, 0, 1),
  };
}

function roundViewportValue(value: number) {
  return Number(value.toFixed(3));
}

export function getVisibleMapBounds(input: VisibleMapBoundsInput): VisibleMapBounds {
  const padding = input.padding ?? 0;
  const scaledWidth = input.contentWidth * input.scale;
  const scaledHeight = input.contentHeight * input.scale;

  return {
    minX: roundViewportValue(clampNumber((0 - input.offsetX) / scaledWidth - padding, 0, 1)),
    maxX: roundViewportValue(clampNumber((input.frameWidth - input.offsetX) / scaledWidth + padding, 0, 1)),
    minY: roundViewportValue(clampNumber((0 - input.offsetY) / scaledHeight - padding, 0, 1)),
    maxY: roundViewportValue(clampNumber((input.frameHeight - input.offsetY) / scaledHeight + padding, 0, 1)),
  };
}

function getPreviewZoomBucket(scale: number) {
  const normalizedScale = clampScale(scale);

  if (normalizedScale < 1.25) {
    return 0;
  }

  if (normalizedScale < 1.55) {
    return 1;
  }

  if (normalizedScale < 2) {
    return 2;
  }

  if (normalizedScale < 2.7) {
    return 3;
  }

  return 4;
}

export function getPreviewSelectionForScale(scale: number): PreviewSelectionDensity {
  const zoomBucket = getPreviewZoomBucket(scale);

  const densityByBucket = [
    { maxCount: 15, minDistance: 0.115 },
    { maxCount: 12, minDistance: 0.105 },
    { maxCount: 9, minDistance: 0.095 },
    { maxCount: 7, minDistance: 0.085 },
    { maxCount: 5, minDistance: 0.075 },
  ] as const;

  const density = densityByBucket[zoomBucket];

  return {
    maxCount: density.maxCount,
    minDistance: density.minDistance,
  };
}

export function getPreviewSelectionSeed(input: PreviewSelectionSeedInput) {
  const zoomBucket = getPreviewZoomBucket(input.scale);
  const centerX = (input.bounds.minX + input.bounds.maxX) / 2;
  const centerY = (input.bounds.minY + input.bounds.maxY) / 2;
  const cellSize = zoomBucket === 0 ? 0.28 : 0.18;
  const cellX = Math.floor(centerX / cellSize);
  const cellY = Math.floor(centerY / cellSize);

  return `z${zoomBucket}:x${cellX}:y${cellY}`;
}

export function getShowcasePreviewSelection(): PreviewSelectionDensity {
  return {
    maxCount: 8,
    minDistance: 0,
  };
}

function stableLocationScore(id: string) {
  let hash = 2166136261;

  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function selectPreviewLocations<T extends PreviewLocationCandidate>(
  locations: T[],
  options: PreviewSelectionOptions = {},
) {
  const maxCount = options.maxCount ?? 10;
  const minDistance = options.minDistance ?? 0.16;
  const bounds = options.bounds;
  const seed = options.seed ?? "global";
  const selected: T[] = [];

  const candidates = locations
    .filter((location) => Boolean(location.coverImagePath))
    .filter((location) => {
      if (!bounds) {
        return true;
      }

      return (
        location.x >= bounds.minX &&
        location.x <= bounds.maxX &&
        location.y >= bounds.minY &&
        location.y <= bounds.maxY
      );
    })
    .toSorted((first, second) => {
      const scoreDiff =
        stableLocationScore(`${seed}:${first.id}`) - stableLocationScore(`${seed}:${second.id}`);
      return scoreDiff === 0 ? first.id.localeCompare(second.id) : scoreDiff;
    });

  for (const candidate of candidates) {
    if (selected.length >= maxCount) {
      break;
    }

    const isTooClose = selected.some((location) => {
      return Math.hypot(location.x - candidate.x, location.y - candidate.y) < minDistance;
    });

    if (!isTooClose) {
      selected.push(candidate);
    }
  }

  return selected;
}
