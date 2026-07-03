import { describe, expect, it } from "vitest";

import {
  getImageUploadSizeError,
  IMAGE_UPLOAD_MAX_BYTES,
  IMAGE_UPLOAD_MAX_MB,
  isImageUploadWithinLimit,
} from "@/lib/upload-constraints";

describe("upload constraints", () => {
  it("allows files up to the 20MB image upload limit", () => {
    expect(IMAGE_UPLOAD_MAX_MB).toBe(20);
    expect(isImageUploadWithinLimit(IMAGE_UPLOAD_MAX_BYTES)).toBe(true);
  });

  it("rejects files larger than the 20MB image upload limit with a user-facing message", () => {
    expect(isImageUploadWithinLimit(IMAGE_UPLOAD_MAX_BYTES + 1)).toBe(false);
    expect(getImageUploadSizeError("large.jpg", IMAGE_UPLOAD_MAX_BYTES + 1)).toBe(
      "large.jpg 超过 20MB，请压缩后再上传。",
    );
  });
});
