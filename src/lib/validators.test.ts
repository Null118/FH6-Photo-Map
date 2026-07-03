import { describe, expect, it } from "vitest";
import {
  customMetaRowSchema,
  locationInputSchema,
  photoInputSchema,
} from "@/lib/validators";

describe("validators", () => {
  it("accepts a valid location payload", () => {
    expect(
      locationInputSchema.parse({
        title: "Volcano Ridge",
        description: "Sunrise spot",
        x: "0.25",
        y: "0.75",
      }),
    ).toEqual({
      title: "Volcano Ridge",
      description: "Sunrise spot",
      x: 0.25,
      y: 0.75,
    });
  });

  it("rejects out-of-range map coordinates", () => {
    expect(() =>
      locationInputSchema.parse({
        title: "Bad Point",
        description: "",
        x: "-0.2",
        y: "1.2",
      }),
    ).toThrow();
  });

  it("accepts photo metadata with custom rows", () => {
    expect(
      photoInputSchema.parse({
        title: "Blue Hour",
        description: "",
        cameraBody: "Sony A7C II",
        lens: "24-70mm",
        focalLength: "35mm",
        aperture: "f/2.8",
        shutterSpeed: "1/80",
        iso: "200",
        shotAt: "2026-06-27T18:30",
        customMeta: [{ key: "Weather", value: "Clear" }],
      }).customMeta,
    ).toEqual([{ key: "Weather", value: "Clear" }]);
  });

  it("rejects empty custom metadata rows", () => {
    expect(() =>
      customMetaRowSchema.parse({
        key: "",
        value: "Anything",
      }),
    ).toThrow();
  });
});
