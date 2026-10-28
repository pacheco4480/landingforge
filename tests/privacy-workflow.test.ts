import { describe, expect, it } from "vitest";

import { PrivacyRequestStatus } from "@/generated/prisma/client";
import {
  defaultPrivacyRequestDueDate,
  maximumPrivacyRequestDueDate,
  privacyStatusTransitions,
  retentionCutoffDate,
} from "@/features/privacy/privacy-workflow";

describe("privacy request workflow", () => {
  it("requires identity review and human decision before approval", () => {
    expect(privacyStatusTransitions[PrivacyRequestStatus.RECEIVED]).toContain(PrivacyRequestStatus.VERIFYING);
    expect(privacyStatusTransitions[PrivacyRequestStatus.VERIFYING]).toContain(PrivacyRequestStatus.VERIFIED);
    expect(privacyStatusTransitions[PrivacyRequestStatus.VERIFIED]).not.toContain(PrivacyRequestStatus.APPROVED);
    expect(privacyStatusTransitions[PrivacyRequestStatus.REVIEW]).toContain(PrivacyRequestStatus.APPROVED);
  });

  it("does not reopen closed requests", () => {
    expect(privacyStatusTransitions[PrivacyRequestStatus.CLOSED]).toEqual([]);
  });
});

describe("retention cutoff", () => {
  it("calculates an explicit UTC-day cutoff", () => {
    expect(retentionCutoffDate(365, new Date("2026-10-27T12:00:00.000Z")).toISOString())
      .toBe("2025-10-27T12:00:00.000Z");
  });

  it("defaults request deadlines to one calendar month, clamping month ends", () => {
    expect(defaultPrivacyRequestDueDate(new Date("2026-10-27T14:30:00.000Z")).toISOString())
      .toBe("2026-11-27T00:00:00.000Z");
    expect(defaultPrivacyRequestDueDate(new Date("2026-01-31T09:00:00.000Z")).toISOString())
      .toBe("2026-02-28T00:00:00.000Z");
    expect(defaultPrivacyRequestDueDate(new Date("2028-01-31T09:00:00.000Z")).toISOString())
      .toBe("2028-02-29T00:00:00.000Z");
  });

  it("caps a recorded extension at two calendar months after the initial deadline", () => {
    expect(maximumPrivacyRequestDueDate(new Date("2026-10-27T14:30:00.000Z")).toISOString())
      .toBe("2027-01-27T00:00:00.000Z");
    expect(maximumPrivacyRequestDueDate(new Date("2026-01-31T09:00:00.000Z")).toISOString())
      .toBe("2026-04-28T00:00:00.000Z");
  });
});
