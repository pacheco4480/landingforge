import { createHash } from "node:crypto";

export const MAX_MAINTENANCE_SOURCE_FILE_BYTES = 100_000;
export const MAX_MAINTENANCE_SOURCE_TOTAL_BYTES = 300_000;
export const MAX_MAINTENANCE_SOURCE_FILES = 12;

export type MaintenanceCodeChange = {
  sourcePath: string;
  packagePath: string;
  content: string;
  baseChecksum: string;
  updatedByUserId: string;
  updatedAt: string;
};

export function maintenanceCodeChanges(value: unknown): MaintenanceCodeChange[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is MaintenanceCodeChange => Boolean(item) && typeof item === "object" &&
    typeof (item as MaintenanceCodeChange).sourcePath === "string" &&
    typeof (item as MaintenanceCodeChange).packagePath === "string" &&
    typeof (item as MaintenanceCodeChange).content === "string" &&
    typeof (item as MaintenanceCodeChange).baseChecksum === "string" &&
    typeof (item as MaintenanceCodeChange).updatedByUserId === "string" &&
    typeof (item as MaintenanceCodeChange).updatedAt === "string");
}

export function sourceChecksum(content: string) {
  return createHash("sha256").update(content).digest("hex");
}

export function maintenanceReleaseSourceChecksum(snapshotChecksum: string, changes: readonly MaintenanceCodeChange[]) {
  const entries = [...changes]
    .sort((a, b) => a.packagePath.localeCompare(b.packagePath))
    .map(({ packagePath, baseChecksum, content }) => [packagePath, baseChecksum, sourceChecksum(content)]);
  return sourceChecksum(JSON.stringify({ snapshotChecksum, codeChanges: entries }));
}

export function validateMaintenanceCodeChangeInput(input: {
  sourcePath: string;
  content: string;
  allowedSourcePaths: readonly string[];
}) {
  const sourcePath = input.sourcePath.trim();
  if (!input.allowedSourcePaths.includes(sourcePath)) throw new Error("O ficheiro não pertence à allowlist de código deste template.");
  if (Buffer.byteLength(input.content, "utf8") > MAX_MAINTENANCE_SOURCE_FILE_BYTES) {
    throw new Error("Cada alteração de código tem um limite de 100 KB.");
  }
}

export function assertMaintenanceCodeChangesWithinLimits(changes: readonly MaintenanceCodeChange[]) {
  if (changes.length > MAX_MAINTENANCE_SOURCE_FILES) throw new Error("Uma release pode alterar no máximo 12 ficheiros de código.");
  const totalBytes = changes.reduce((total, change) => total + Buffer.byteLength(change.content, "utf8"), 0);
  if (totalBytes > MAX_MAINTENANCE_SOURCE_TOTAL_BYTES) throw new Error("As alterações de código excedem o limite total de 300 KB.");
}
