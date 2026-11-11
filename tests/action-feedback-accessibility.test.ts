import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

import {
  ActionFeedbackForm,
  ToastProvider,
} from "@/components/ui/action-feedback";

describe("action feedback accessibility", () => {
  it("keeps an assertive atomic alert region mounted before an error occurs", () => {
    const markup = renderToStaticMarkup(
      createElement(
        ToastProvider,
        null,
        createElement(
          ActionFeedbackForm,
          { action: async () => undefined },
          createElement("button", { type: "submit" }, "Guardar"),
        ),
      ),
    );

    expect(markup).toMatch(
      /<p[^>]*role="alert"[^>]*aria-live="assertive"[^>]*aria-atomic="true"[^>]*><\/p>/,
    );
  });
});
