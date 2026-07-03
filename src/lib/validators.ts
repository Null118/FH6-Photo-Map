import { z } from "zod";

export const customMetaRowSchema = z.object({
  key: z.string().trim().min(1, "Custom field name is required."),
  value: z.string().trim().min(1, "Custom field value is required."),
});

export const photoInputSchema = z.object({
  title: z.string().trim().min(1, "Photo title is required."),
  description: z.string().trim().default(""),
  cameraBody: z.string().trim().optional(),
  lens: z.string().trim().optional(),
  focalLength: z.string().trim().optional(),
  aperture: z.string().trim().optional(),
  shutterSpeed: z.string().trim().optional(),
  iso: z.string().trim().optional(),
  shotAt: z.string().trim().optional(),
  customMeta: z.array(customMetaRowSchema).default([]),
});

export const locationInputSchema = z.object({
  title: z.string().trim().min(1, "Location title is required."),
  description: z.string().trim().default(""),
  x: z.coerce.number().min(0).max(1),
  y: z.coerce.number().min(0).max(1),
});
