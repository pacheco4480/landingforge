import { describe, expect, it } from "vitest";

import {
  allowedMediaTypes,
  validateMediaFile,
} from "@/features/media/schemas/media.schema";

describe("media validation", () => {
  it("lists only supported media types", () => {
    expect(allowedMediaTypes).toContain("image/webp");
    expect(allowedMediaTypes).toContain("application/pdf");
  });

  it("rejects unsupported files", () => {
    const file = new File(["bad"], "bad.exe", {
      type: "application/x-msdownload",
    });

    expect(() => validateMediaFile(file, 10)).toThrow("Unsupported file type");
  });
});
