import { describe, expect, it } from "vitest";

import {
  projectChecklistItems,
  projectChecklistProgress,
  withProjectChecklistDefaults,
} from "@/features/briefings/project-checklist";

describe("project delivery checklist", () => {
  it("provides every checklist item as missing without mutating the source", () => {
    const records: never[] = [];
    const checklist = withProjectChecklistDefaults(records);

    expect(checklist.map(({ key }) => key)).toEqual(
      projectChecklistItems.map(({ key }) => key),
    );
    expect(checklist.every(({ status }) => status === "MISSING")).toBe(true);
    expect(records).toEqual([]);
  });

  it("counts only completed and not-applicable items as ready", () => {
    const checklist = withProjectChecklistDefaults([
      { key: "LOGO", status: "COMPLETE", note: null, reference: null },
      { key: "CONTENT", status: "IN_PROGRESS", note: null, reference: null },
      {
        key: "IMAGES",
        status: "NOT_APPLICABLE",
        note: null,
        reference: null,
      },
    ]);

    expect(projectChecklistProgress(checklist)).toEqual({
      complete: 2,
      total: 7,
      percent: 29,
    });
  });

  it("accepts only known keys and uses the latest supplied record per key", () => {
    const checklist = withProjectChecklistDefaults([
      { key: "PAYMENT", status: "IN_PROGRESS", note: null, reference: null },
      { key: "PAYMENT", status: "COMPLETE", note: null, reference: "REF-1" },
    ]);

    expect(checklist).toHaveLength(7);
    expect(checklist.find(({ key }) => key === "PAYMENT")?.status).toBe(
      "COMPLETE",
    );
  });
});
