import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { IMAGE_UPLOAD_MAX_BYTES } from "@/lib/upload-constraints";

import { PhotoFields } from "./photo-fields";

describe("PhotoFields", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("alerts and clears the input when a selected image exceeds 20MB", () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    render(<PhotoFields />);

    const imageInput = screen.getByLabelText("图片文件") as HTMLInputElement;
    const file = new File(["x"], "large.jpg", { type: "image/jpeg" });
    Object.defineProperty(file, "size", {
      value: IMAGE_UPLOAD_MAX_BYTES + 1,
    });

    fireEvent.change(imageInput, { target: { files: [file] } });

    expect(alertSpy).toHaveBeenCalledWith("large.jpg 超过 20MB，请压缩后再上传。");
    expect(screen.getByRole("alert").textContent).toBe("large.jpg 超过 20MB，请压缩后再上传。");
    expect(imageInput.value).toBe("");
  });
});
