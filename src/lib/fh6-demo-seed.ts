export const FH6_DEMO_LOCATION_COUNT = 50;
export const FH6_DEMO_APPROVED_COUNT = 40;
export const FH6_DEMO_TITLE_PREFIX = "FH6 Demo Spot";

const FORZA_IMAGE_PATTERN = /https:\/\/cdn\.forza\.net\/strapi-uploads\/assets\/[^"'\s)<>]+/g;
const FH6_IMAGE_PATTERN = /(Forza[_-]Horizon_?6|Forza_Horizon6|Horizon_6|FH6)/i;
const SUPPORTED_IMAGE_PATTERN = /\.(jpg|jpeg|png|webp)$/i;
const SIZE_PREFIX_PATTERN = /^(tiny|thumbnail|small|medium|large|xlarge|massive)_/i;
const HASH_SUFFIX_PATTERN = /_[0-9a-f]{10,}$/i;

type DemoReviewStatus = "approved" | "pending";

export type DemoLocationDraft = {
  sourceUrl: string;
  localFileBaseName: string;
  sceneKey: string;
  location: {
    title: string;
    description: string;
    x: number;
    y: number;
    isPublished: boolean;
    status: DemoReviewStatus;
  };
  photo: {
    title: string;
    description: string;
    sortOrder: number;
    isPublished: boolean;
    status: DemoReviewStatus;
    cameraBody: string;
    lens: string;
    focalLength: string;
    aperture: string;
    shutterSpeed: string;
    iso: string;
    customMeta: Array<{ key: string; value: string }>;
  };
};

const cameraBodies = ["Nikon Zf", "Canon EOS R6 Mark II", "Sony A7 IV", "Fujifilm X-T5"];
const lenses = ["24-70mm f/2.8", "35mm f/1.8", "70-200mm f/2.8", "16-35mm f/4"];
const focalLengths = ["24mm", "28mm", "35mm", "50mm", "70mm", "85mm"];
const apertures = ["f/2.8", "f/4", "f/5.6", "f/8"];
const shutterSpeeds = ["1/125", "1/200", "1/320", "1/500", "1/800"];
const isoValues = ["100", "160", "200", "400", "640"];

export function extractForzaImageUrls(payloadText: string) {
  const normalized = payloadText.replace(/\\u002F/g, "/");
  const matches = normalized.match(FORZA_IMAGE_PATTERN) ?? [];

  return Array.from(new Set(matches))
    .filter((url) => FH6_IMAGE_PATTERN.test(url))
    .filter((url) => SUPPORTED_IMAGE_PATTERN.test(url));
}

export function getForzaSceneKey(url: string) {
  const filename = decodeURIComponent(url.split("/").pop() ?? url);

  return filename
    .replace(SUPPORTED_IMAGE_PATTERN, "")
    .replace(SIZE_PREFIX_PATTERN, "")
    .replace(HASH_SUFFIX_PATTERN, "")
    .replace(/_WM$/i, "");
}

export function selectDemoImageUrls(urls: string[], count = FH6_DEMO_LOCATION_COUNT) {
  const uniqueUrls = Array.from(new Set(urls)).filter((url) => FH6_IMAGE_PATTERN.test(url));
  const groupedByScene = new Map<string, string[]>();

  for (const url of uniqueUrls) {
    const sceneKey = getForzaSceneKey(url);
    groupedByScene.set(sceneKey, [...(groupedByScene.get(sceneKey) ?? []), url]);
  }

  const groups = Array.from(groupedByScene.entries())
    .map(([sceneKey, sceneUrls]) => ({
      sceneKey,
      urls: sceneUrls.toSorted((left, right) => getImagePreferenceScore(right) - getImagePreferenceScore(left)),
    }))
    .toSorted((left, right) => left.sceneKey.localeCompare(right.sceneKey));

  const primarySceneUrls = groups.map((group) => group.urls[0]).filter(Boolean);
  const variantUrls = groups.flatMap((group) => group.urls.slice(1));
  const selected = [...primarySceneUrls, ...variantUrls].slice(0, count);

  if (selected.length < count) {
    throw new Error(`Expected at least ${count} FH6 image URLs, received ${selected.length}.`);
  }

  return selected;
}

export function buildDemoLocationDrafts(
  imageUrls: string[],
  approvedCount = FH6_DEMO_APPROVED_COUNT,
): DemoLocationDraft[] {
  if (imageUrls.length < FH6_DEMO_LOCATION_COUNT) {
    throw new Error(`Expected ${FH6_DEMO_LOCATION_COUNT} image URLs, received ${imageUrls.length}.`);
  }

  return imageUrls.slice(0, FH6_DEMO_LOCATION_COUNT).map((sourceUrl, index) => {
    const serial = String(index + 1).padStart(3, "0");
    const status: DemoReviewStatus = index < approvedCount ? "approved" : "pending";
    const isPublished = status === "approved";
    const sceneKey = getForzaSceneKey(sourceUrl);
    const sceneTitle = formatSceneTitle(sceneKey);
    const coordinates = getDemoCoordinates(index);

    return {
      sourceUrl,
      localFileBaseName: `fh6-demo-${serial}`,
      sceneKey,
      location: {
        title: `${FH6_DEMO_TITLE_PREFIX} ${serial}`,
        description: `${sceneTitle} 的演示摄影点，用于测试普通用户投稿、管理员审核和地图预览流程。`,
        x: coordinates.x,
        y: coordinates.y,
        isPublished,
        status,
      },
      photo: {
        title: sceneTitle,
        description: `由 driver 账号提交的 FH6 官方风景参考图，当前状态：${status === "approved" ? "已通过审核" : "待审核"}。`,
        sortOrder: 0,
        isPublished,
        status,
        cameraBody: pick(cameraBodies, index),
        lens: pick(lenses, index + 1),
        focalLength: pick(focalLengths, index + 2),
        aperture: pick(apertures, index + 3),
        shutterSpeed: pick(shutterSpeeds, index + 4),
        iso: pick(isoValues, index + 5),
        customMeta: [
          { key: "素材来源", value: "Forza 官方 CDN" },
          { key: "演示批次", value: "FH6 demo seed" },
          { key: "原始场景", value: sceneKey },
        ],
      },
    };
  });
}

function getImagePreferenceScore(url: string) {
  const filename = url.toLowerCase();
  let score = 0;

  if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) score += 20;
  if (filename.includes("/large_")) score += 80;
  if (filename.includes("/xlarge_")) score += 70;
  if (filename.includes("/medium_")) score += 60;
  if (filename.includes("/massive_")) score += 40;
  if (filename.includes("/small_")) score += 30;
  if (filename.includes("_wm_")) score -= 10;

  return score;
}

function getDemoCoordinates(index: number) {
  const column = index % 10;
  const row = Math.floor(index / 10);
  const jitterX = (deterministicUnit(index, 11) - 0.5) * 0.055;
  const jitterY = (deterministicUnit(index, 29) - 0.5) * 0.1;
  const x = clamp(0.06, 0.94, (column + 0.5) / 10 + jitterX);
  const y = clamp(0.08, 0.92, (row + 0.5) / 5 + jitterY);

  return {
    x: roundCoordinate(x),
    y: roundCoordinate(y),
  };
}

function deterministicUnit(index: number, salt: number) {
  const raw = Math.sin((index + 1) * 12.9898 + salt * 78.233) * 43758.5453;

  return raw - Math.floor(raw);
}

function formatSceneTitle(sceneKey: string) {
  return sceneKey
    .replace(/^Forza_Horizon6_/i, "")
    .replace(/^Forza_Horizon_6_/i, "")
    .replace(/_16x9$/i, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function pick<T>(items: T[], index: number) {
  return items[index % items.length];
}

function clamp(min: number, max: number, value: number) {
  return Math.min(max, Math.max(min, value));
}

function roundCoordinate(value: number) {
  return Number(value.toFixed(4));
}
