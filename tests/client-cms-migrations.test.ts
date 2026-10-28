import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationDirectory = join(process.cwd(), "prisma", "client-runtime", "migrations");

describe("client CMS migrations", () => {
  it("uses an isolated data model with project-scoped relational constraints", () => {
    const initial = readFileSync(join(migrationDirectory, "0001_client_cms_foundation.sql"), "utf8");
    expect(initial).toContain("lf_cms_installations");
    expect(initial).toContain("form_type text NOT NULL DEFAULT 'CONTACT'");
    expect(initial).toContain("FOREIGN KEY (project_id, page_id)");
    expect(initial).toContain("FOREIGN KEY (project_id, form_id)");
    expect(initial).toContain("FOREIGN KEY (project_id, submission_id)");
    expect(initial).not.toMatch(/\bDROP\s+(TABLE|SCHEMA|DATABASE)\b|\bTRUNCATE\b/i);
  });

  it("uses only additive update migrations so content and leads survive upgrades", () => {
    const update = readFileSync(join(migrationDirectory, "0002_content_revision.sql"), "utf8");
    expect(update).toMatch(/ADD COLUMN IF NOT EXISTS content_revision/i);
    expect(update).toContain("CREATE INDEX IF NOT EXISTS");
    expect(update).not.toMatch(/\bDROP\s+(TABLE|COLUMN|SCHEMA|DATABASE)\b|\bTRUNCATE\b|\bDELETE\s+FROM\b/i);
  });
});
