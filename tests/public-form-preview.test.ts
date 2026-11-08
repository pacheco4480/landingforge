import { describe, expect, it } from "vitest";

import { rejectPreviewFormSubmissionAction } from "@/features/public-renderer/actions/public-form.actions";

describe("public form preview action", () => {
  it("rejects submissions without persisting or sending form data", async () => {
    const formData = new FormData();
    formData.set("email", "qa@example.test");

    await expect(rejectPreviewFormSubmissionAction(formData)).resolves.toEqual({
      ok: false,
      fieldErrors: {},
      formError: "O envio está desativado nesta pré-visualização.",
    });
  });
});
